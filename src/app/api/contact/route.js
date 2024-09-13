import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();

    // Validate form data
    const { name, email, message } = body;
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), {
        status: 400,
      });
    }

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can use another email service
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password (if using Gmail)
      },
    });

    // Send email
    const mailOptions = {
      from: email, // Sender's email address
      to: process.env.RECIPIENT_EMAIL, // Your email address to receive the messages
      subject: `New message from ${name}`,
      text: `Message from ${name} (${email}):\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    // Respond with success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
