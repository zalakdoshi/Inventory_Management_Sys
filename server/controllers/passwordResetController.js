const { PasswordResetRequest, User } = require('../models/index');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { createActivityLog } = require('../middleware/activityLog');
const logger = require('../utils/logger');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

const sendResetEmail = async (email, token, userName) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: `"Inventory Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Approved — Inventory Management System',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f0fdf4;padding:30px;border-radius:10px;">
          <div style="background:#166534;padding:20px;border-radius:8px;text-align:center;">
            <h1 style="color:white;margin:0;">Inventory Management System</h1>
          </div>
          <div style="padding:20px;">
            <h2>Hello ${userName},</h2>
            <p>Your password reset request has been <strong>approved by the administrator</strong>.</p>
            <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${resetUrl}" style="background:#16a34a;color:white;padding:12px 30px;border-radius:6px;text-decoration:none;font-size:16px;">Reset Password</a>
            </div>
            <p style="color:#666;font-size:13px;">If you didn't request this, ignore this email.</p>
          </div>
        </div>
      `,
    });
    logger.info(`Reset email sent successfully to ${email}`);
  } catch (error) {
    logger.error('sendResetEmail FAILED:', error.message);
    throw error;
  }
};

const notifyAdminsOfRequest = async (requesterName, requesterEmail, requesterRole) => {
  try {
    const admins = User.findAll({ role: 'admin', isActive: true });
    if (!admins.length) {
      logger.warn('notifyAdminsOfRequest: No active admin users found to notify.');
      return;
    }
    const transporter = createTransporter();
    const adminPanelUrl = `${process.env.FRONTEND_URL}/admin/password-reset`;
    const adminEmails = admins.map(a => a.email);
    logger.info(`Notifying ${admins.length} admin(s) of password reset request: ${adminEmails.join(', ')}`);

    await transporter.sendMail({
      from: `"Inventory Management System" <${process.env.EMAIL_USER}>`,
      to: adminEmails,
      subject: `⚠️ Password Reset Request — ${requesterName} (${requesterRole})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:30px;border-radius:10px;">
          <div style="background:#166534;padding:20px;border-radius:8px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:20px;">Inventory Management System</h1>
            <p style="color:#bbf7d0;margin:6px 0 0 0;font-size:13px;">Admin Action Required</p>
          </div>
          <div style="padding:24px;background:white;margin-top:16px;border-radius:8px;border:1px solid #e5e7eb;">
            <h2 style="color:#111827;margin:0 0 12px;">New Password Reset Request</h2>
            <p style="color:#374151;">A user has requested a password reset and is waiting for your approval.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;color:#6b7280;font-size:13px;">Name</td><td style="padding:8px;font-weight:600;color:#111827;">${requesterName}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;font-size:13px;">Email</td><td style="padding:8px;font-weight:600;color:#111827;">${requesterEmail}</td></tr>
              <tr><td style="padding:8px;color:#6b7280;font-size:13px;">Role</td><td style="padding:8px;font-weight:600;color:#111827;text-transform:capitalize;">${requesterRole}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;font-size:13px;">Requested At</td><td style="padding:8px;font-weight:600;color:#111827;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
            </table>
            <div style="text-align:center;margin:24px 0 8px;">
              <a href="${adminPanelUrl}" style="background:#16a34a;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">Review Request →</a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    logger.error('notifyAdminsOfRequest FAILED:', error.message);
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with this email.' });

    const existing = PasswordResetRequest.findOne({ userId: user.id, status: 'pending' });
    if (existing) return res.status(400).json({ success: false, message: 'A reset request is already pending admin approval.' });

    PasswordResetRequest.create({ user: user.id, userName: user.name, userEmail: user.email, userRole: user.role });
    createActivityLog({ user, action: 'PASSWORD_RESET', module: 'PasswordReset', description: `${user.name} requested a password reset`, req, severity: 'medium' });
    notifyAdminsOfRequest(user.name, user.email, user.role);

    res.status(201).json({ success: true, message: 'Password reset request submitted. Admin will review and approve.' });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getResetRequests = (req, res) => {
  try {
    const { status = '' } = req.query;
    const requests = PasswordResetRequest.find({ status });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const handleResetRequest = async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const request = PasswordResetRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed.' });

    if (action === 'approve') {
      const token = crypto.randomBytes(32).toString('hex');
      PasswordResetRequest.update(req.params.id, {
        status: 'approved', resetToken: token,
        resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        approvedBy: req.user._id, adminNote: adminNote || '', resolvedAt: new Date().toISOString(),
      });

      try {
        await sendResetEmail(request.user_email, token, request.user_name);
      } catch (emailErr) {
        PasswordResetRequest.update(req.params.id, { status: 'pending', resetToken: null, resetTokenExpiry: null });
        return res.status(500).json({ success: false, message: 'Approval saved but email failed to send. Check EMAIL_PASSWORD.' });
      }

      createActivityLog({ user: req.user, action: 'APPROVE', module: 'PasswordReset', description: `Admin approved password reset for ${request.user_name}`, req, severity: 'high' });
      return res.status(200).json({ success: true, message: `Reset link sent to ${request.user_email}` });
    }

    PasswordResetRequest.update(req.params.id, { status: 'rejected', approvedBy: req.user._id, adminNote: adminNote || '', resolvedAt: new Date().toISOString() });
    createActivityLog({ user: req.user, action: 'REJECT', module: 'PasswordReset', description: `Admin rejected password reset for ${request.user_name}`, req, severity: 'medium' });
    res.status(200).json({ success: true, message: 'Reset request rejected.' });
  } catch (error) {
    logger.error('Handle reset request error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const request = PasswordResetRequest.findOne({ resetToken: token, status: 'approved' });
    if (!request) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    if (new Date(request.reset_token_expiry) < new Date()) return res.status(400).json({ success: false, message: 'Reset token has expired.' });

    const user = User.findById(request.user_id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await User.updatePassword(user.id, newPassword);
    PasswordResetRequest.update(request.id, { resetToken: null, resetTokenExpiry: null });
    res.status(200).json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (error) {
    logger.error('Confirm password reset error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { requestPasswordReset, getResetRequests, handleResetRequest, confirmPasswordReset };
