// Contact Controller (MongoDB)
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } });

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required' });

    const contact = await Contact.create({ name, email, subject: subject || 'General Inquiry', message, createdAt: new Date() });

    // Confirmation email to customer
    try { await transporter.sendMail({ from: `GN SONS <${process.env.EMAIL_USER}>`, to: email, subject: 'We received your message - GN SONS', html: `<p>Dear ${name}, we received your message. Thank you.</p>` }); } catch (e) { console.error('Email error:', e.message); }

    // Notify admin
    try { await transporter.sendMail({ from: `GN SONS <${process.env.EMAIL_USER}>`, to: process.env.ADMIN_EMAIL, subject: `New Contact Form - ${subject || 'General Inquiry'}`, html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>` }); } catch (e) { console.error('Admin notify error:', e.message); }

    res.status(201).json({ success: true, message: 'Your message has been sent.', contactId: contact._id });
  } catch (error) { console.error('Contact form error:', error); res.status(500).json({ error: 'Failed to submit form', message: error.message }); }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    // Ensure status field exists for older records
    const normalized = contacts.map(c => ({ status: c.status || 'unread', ...c }));
    res.json({ success: true, count: normalized.length, contacts: normalized });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch contacts', message: error.message }); }
};

exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await Contact.findByIdAndUpdate(id, { status, updatedAt: new Date() });
    res.json({ success: true, message: 'Contact status updated' });
  } catch (error) { res.status(500).json({ error: 'Failed to update status', message: error.message }); }
};

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await Contact.findByIdAndDelete(id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact', message: error.message });
  }
};
