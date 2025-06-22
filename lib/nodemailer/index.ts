import nodemailer from 'nodemailer';
import { Product } from '@/types';

type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

export const generateEmailBody = async (product: Product, type: string): Promise<EmailContent> => {
  const title = product.title.length > 50 ? product.title.substring(0, 47) + '...' : product.title;

  if (type === 'WELCOME') {
    return {
      subject: `Start Tracking ${title} with Pricewise`,
      text: `You are now tracking ${product.title}. We'll notify you of price changes!`,
      html: `
        <h2>Welcome to Pricewise</h2>
        <p>You are now tracking <b>${product.title}</b>.</p>
        <p>We'll send you email alerts when the price changes.</p>
        <p>Visit <a href="${product.url}" target="_blank">the product page</a> for details.</p>
        <p>Thank you for using Pricewise!</p>
      `,
    };
  }

  return {
    subject: `Price Update for ${title}`,
    text: `Price update for ${product.title}. Check the latest price!`,
    html: `<p>Price update for <b>${product.title}</b>. Check the latest price!</p>`,
  };
};

export const sendEmail = async (emailContent: EmailContent, recipients: string[]) => {
  try {
    // Log environment variables (for debugging, avoid in production)
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Missing');

    // Validate credentials
    if (!process.env.EMAIL_USER) {
      console.error('EMAIL_USER is not defined in .env.local');
      throw new Error('Missing EMAIL_USER credential');
    }
    if (!process.env.EMAIL_PASS) {
      console.error('EMAIL_PASS is not defined in .env.local');
      throw new Error('Missing EMAIL_PASS credential');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Pricewise Team" <${process.env.EMAIL_USER}>`,
      to: recipients.join(','),
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipients.join(',')}: ${info.response}`);
    return info;
  } catch (error: any) {
    console.error(`Failed to send email to ${recipients.join(',')}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};