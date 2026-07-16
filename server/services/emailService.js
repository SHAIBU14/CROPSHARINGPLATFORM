const nodemailer = require('nodemailer');

// Create transporter using Gmail (you can configure other email services)
// For development, using Gmail with app password
const createTransporter = () => {
  // Check if we have email credentials in environment
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Fallback to demo mode (just logs email instead of sending)
  console.warn('Email credentials not configured. Using DEMO mode (emails will be logged).');
  
  return nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
    ignoreTLS: true
  });
};

const transporter = createTransporter();

/**
 * Send payment confirmation email to buyer
 */
exports.sendPaymentConfirmationEmail = async (buyerEmail, buyerName, paymentDetails) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h2 { margin: 0; }
          .section { background: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #16a34a; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0; }
          .detail-item { padding: 10px; background: white; border-radius: 3px; }
          .label { font-weight: bold; color: #666; font-size: 0.9em; }
          .value { font-size: 1.1em; color: #333; margin-top: 5px; }
          .payment-methods { background: white; padding: 15px; border: 2px solid #16a34a; border-radius: 5px; margin: 15px 0; }
          .method-item { margin: 10px 0; padding: 10px; background: #f0fdf4; border-left: 3px solid #16a34a; }
          .method-item strong { color: #15803d; }
          .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 5px 10px; border-radius: 20px; font-size: 0.9em; margin: 10px 0; }
          .footer { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 15px; font-size: 0.9em; color: #666; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .warning strong { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🌱 Payment Submitted Successfully</h2>
            <p>Your online payment has been submitted to the seller for verification</p>
          </div>

          <div class="section">
            <h3>Hello ${buyerName},</h3>
            <p>Thank you for shopping on GardenShare! Your payment has been successfully submitted.</p>
          </div>

          <div class="section">
            <h4>📋 Payment Details</h4>
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Transaction ID</div>
                <div class="value" style="word-break: break-all;">${paymentDetails.transactionId}</div>
              </div>
              <div class="detail-item">
                <div class="label">Payment App</div>
                <div class="value">${paymentDetails.paymentApp}</div>
              </div>
              <div class="detail-item">
                <div class="label">Amount Paid</div>
                <div class="value">₹${paymentDetails.totalAmount}</div>
              </div>
              <div class="detail-item">
                <div class="label">Payment Date</div>
                <div class="value">${new Date(paymentDetails.paymentDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>🥕 Crop Details</h4>
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Crop Name</div>
                <div class="value">${paymentDetails.cropName}</div>
              </div>
              <div class="detail-item">
                <div class="label">Quantity</div>
                <div class="value">${paymentDetails.quantity} ${paymentDetails.cropUnit}</div>
              </div>
              <div class="detail-item">
                <div class="label">Price per Unit</div>
                <div class="value">₹${paymentDetails.cropPrice}/${paymentDetails.cropUnit}</div>
              </div>
              <div class="detail-item">
                <div class="label">Seller</div>
                <div class="value">${paymentDetails.sellerName}</div>
              </div>
            </div>
          </div>

          <div class="payment-methods">
            <h4>📱 Payment Verification Process</h4>
            <div class="method-item">
              <strong>Status:</strong> <span class="status-badge">Pending Verification</span>
            </div>
            <div class="method-item">
              <strong>Next Step:</strong> The seller will verify your payment within 24 hours. You'll receive an email notification once your payment is verified.
            </div>
            <div class="method-item">
              <strong>What Happens Next:</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Seller reviews your transaction details</li>
                <li>Seller verifies the payment received</li>
                <li>Your order status updates to "Confirmed"</li>
                <li>You'll be notified via email</li>
              </ul>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Important Information:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Never share your Transaction ID or payment proof with anyone else</li>
              <li>Keep your transaction ID safe for dispute resolution</li>
              <li>If the seller rejects your payment, you'll receive an explanation email</li>
            </ul>
          </div>

          <div class="section">
            <h4>📍 Check Payment Status</h4>
            <p>You can check your payment status anytime in your Payment History:</p>
            <a href="${process.env.CLIENT_URL}/buyer/payment-history" class="button">View Payment History</a>
          </div>

          <div class="footer">
            <p><strong>Need Help?</strong></p>
            <p>If you have any questions about your payment, please contact our support team or reach out to the seller directly.</p>
            <p>© ${new Date().getFullYear()} GardenShare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gardenshare.com',
      to: buyerEmail,
      subject: `Payment Submitted - Transaction #${paymentDetails.transactionId.substring(0, 10)}... | GardenShare`,
      html: htmlContent,
      text: `
        Payment Submitted Successfully
        
        Hello ${buyerName},
        
        Your payment has been successfully submitted to the seller for verification.
        
        Transaction ID: ${paymentDetails.transactionId}
        Payment App: ${paymentDetails.paymentApp}
        Amount: ₹${paymentDetails.totalAmount}
        Date: ${new Date(paymentDetails.paymentDate).toLocaleDateString()}
        
        Crop: ${paymentDetails.cropName}
        Quantity: ${paymentDetails.quantity} ${paymentDetails.cropUnit}
        Seller: ${paymentDetails.sellerName}
        
        Status: Pending Verification
        
        The seller will verify your payment within 24 hours. You'll receive an email notification once your payment is verified.
        
        Check your payment status: ${process.env.CLIENT_URL}/buyer/payment-history
        
        © ${new Date().getFullYear()} GardenShare
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to ${buyerEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending payment confirmation email:', error.message);
    // Don't fail the payment creation if email fails
    return { success: false, error: error.message };
  }
};

/**
 * Send payment verification notification to seller
 */
exports.sendPaymentVerificationEmail = async (sellerEmail, sellerName, paymentDetails) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h2 { margin: 0; }
          .section { background: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #16a34a; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0; }
          .detail-item { padding: 10px; background: white; border-radius: 3px; }
          .label { font-weight: bold; color: #666; font-size: 0.9em; }
          .value { font-size: 1.1em; color: #333; margin-top: 5px; }
          .buyer-info { background: white; padding: 15px; border: 2px solid #16a34a; border-radius: 5px; margin: 15px 0; }
          .action-buttons { display: flex; gap: 10px; margin: 15px 0; }
          .button { flex: 1; display: inline-block; padding: 10px 20px; border-radius: 5px; text-decoration: none; text-align: center; font-weight: bold; }
          .button-verify { background: #16a34a; color: white; }
          .button-reject { background: #dc2626; color: white; }
          .footer { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 15px; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>💰 New Payment Received</h2>
            <p>A buyer has submitted payment for your crop</p>
          </div>

          <div class="section">
            <h3>Hello ${sellerName},</h3>
            <p>Great news! A buyer has submitted payment for your crop. Please review and verify the payment details below.</p>
          </div>

          <div class="section">
            <h4>📋 Payment Details</h4>
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Transaction ID</div>
                <div class="value" style="word-break: break-all; font-size: 0.9em;">${paymentDetails.transactionId}</div>
              </div>
              <div class="detail-item">
                <div class="label">Payment App</div>
                <div class="value">${paymentDetails.paymentApp}</div>
              </div>
              <div class="detail-item">
                <div class="label">Amount</div>
                <div class="value">₹${paymentDetails.totalAmount}</div>
              </div>
              <div class="detail-item">
                <div class="label">Payment Date</div>
                <div class="value">${new Date(paymentDetails.paymentDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="buyer-info">
            <h4>👤 Buyer Information</h4>
            <p><strong>${paymentDetails.buyerName}</strong></p>
            <p>Email: ${paymentDetails.buyerEmail}</p>
            <p>Phone: ${paymentDetails.buyerPhone || 'Not provided'}</p>
          </div>

          <div class="section">
            <h4>🥕 Crop Details</h4>
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Crop Name</div>
                <div class="value">${paymentDetails.cropName}</div>
              </div>
              <div class="detail-item">
                <div class="label">Quantity</div>
                <div class="value">${paymentDetails.quantity} ${paymentDetails.cropUnit}</div>
              </div>
              <div class="detail-item">
                <div class="label">Price per Unit</div>
                <div class="value">₹${paymentDetails.cropPrice}/${paymentDetails.cropUnit}</div>
              </div>
              <div class="detail-item">
                <div class="label">Total Amount</div>
                <div class="value" style="color: #16a34a; font-weight: bold;">₹${paymentDetails.totalAmount}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>✅ Next Steps</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Review the payment details above</li>
              <li>Check if you've received the payment in your account</li>
              <li>Visit your Payment Verification Dashboard to approve or reject the payment</li>
              <li>Add verification notes if needed</li>
            </ol>
            <div class="action-buttons">
              <a href="${process.env.CLIENT_URL}/seller/payment-verification" class="button button-verify">View in Dashboard</a>
            </div>
          </div>

          <div class="footer">
            <p><strong>Important:</strong> Always verify that you've received the payment before confirming it in the system.</p>
            <p>© ${new Date().getFullYear()} GardenShare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gardenshare.com',
      to: sellerEmail,
      subject: `New Payment Received - ${paymentDetails.cropName} | GardenShare`,
      html: htmlContent,
      text: `
        New Payment Received
        
        Hello ${sellerName},
        
        A buyer has submitted payment for your crop. Please review the details below.
        
        Transaction ID: ${paymentDetails.transactionId}
        Payment App: ${paymentDetails.paymentApp}
        Amount: ₹${paymentDetails.totalAmount}
        Date: ${new Date(paymentDetails.paymentDate).toLocaleDateString()}
        
        Buyer: ${paymentDetails.buyerName}
        Email: ${paymentDetails.buyerEmail}
        Phone: ${paymentDetails.buyerPhone || 'Not provided'}
        
        Crop: ${paymentDetails.cropName}
        Quantity: ${paymentDetails.quantity} ${paymentDetails.cropUnit}
        
        Please verify the payment in your Payment Verification Dashboard:
        ${process.env.CLIENT_URL}/seller/payment-verification
        
        © ${new Date().getFullYear()} GardenShare
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Payment notification email sent to ${sellerEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending payment notification email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment verified notification to buyer
 */
exports.sendPaymentVerifiedEmail = async (buyerEmail, buyerName, paymentDetails) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h2 { margin: 0; }
          .success-badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 10px 15px; border-radius: 5px; font-weight: bold; margin: 10px 0; }
          .section { background: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #16a34a; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0; }
          .detail-item { padding: 10px; background: white; border-radius: 3px; }
          .label { font-weight: bold; color: #666; font-size: 0.9em; }
          .value { font-size: 1.1em; color: #333; margin-top: 5px; }
          .next-steps { background: white; padding: 15px; border: 2px solid #16a34a; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 0; }
          .footer { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 15px; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Payment Verified!</h2>
            <p>Your payment has been confirmed by the seller</p>
          </div>

          <div class="section">
            <h3>Hello ${buyerName},</h3>
            <p>Great news! Your payment has been verified by the seller. Your order is now confirmed!</p>
            <div class="success-badge">✓ Payment Verified</div>
          </div>

          <div class="section">
            <h4>📋 Payment Details</h4>
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Transaction ID</div>
                <div class="value" style="word-break: break-all; font-size: 0.9em;">${paymentDetails.transactionId}</div>
              </div>
              <div class="detail-item">
                <div class="label">Status</div>
                <div class="value" style="color: #16a34a; font-weight: bold;">Verified</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>🥕 Order Details</h4>
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Crop</div>
                <div class="value">${paymentDetails.cropName}</div>
              </div>
              <div class="detail-item">
                <div class="label">Quantity</div>
                <div class="value">${paymentDetails.quantity} ${paymentDetails.cropUnit}</div>
              </div>
              <div class="detail-item">
                <div class="label">Total Amount</div>
                <div class="value">₹${paymentDetails.totalAmount}</div>
              </div>
              <div class="detail-item">
                <div class="label">Seller</div>
                <div class="value">${paymentDetails.sellerName}</div>
              </div>
            </div>
          </div>

          <div class="next-steps">
            <h4>📦 What's Next?</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>The seller will prepare your order for delivery</li>
              <li>You'll receive a notification when it's ready for pickup/delivery</li>
              <li>Complete the transaction and receive your crops</li>
            </ol>
          </div>

          <div class="section">
            <h4>📍 Track Your Order</h4>
            <p>You can track your order status in your Payment History:</p>
            <a href="${process.env.CLIENT_URL}/buyer/payment-history" class="button">View Order Status</a>
          </div>

          <div class="footer">
            <p>Thank you for shopping on GardenShare!</p>
            <p>© ${new Date().getFullYear()} GardenShare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gardenshare.com',
      to: buyerEmail,
      subject: `Payment Verified - Your Order is Confirmed! | GardenShare`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Payment verified email sent to ${buyerEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending payment verified email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment rejected notification to buyer
 */
exports.sendPaymentRejectedEmail = async (buyerEmail, buyerName, paymentDetails, rejectionReason) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 5px; }
          .header h2 { margin: 0; }
          .rejection-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 10px 15px; border-radius: 5px; font-weight: bold; margin: 10px 0; }
          .section { background: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #dc2626; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0; }
          .detail-item { padding: 10px; background: white; border-radius: 3px; }
          .label { font-weight: bold; color: #666; font-size: 0.9em; }
          .value { font-size: 1.1em; color: #333; margin-top: 5px; }
          .reason-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 0; }
          .footer { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 15px; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>❌ Payment Not Verified</h2>
            <p>Your payment could not be verified by the seller</p>
          </div>

          <div class="section">
            <h3>Hello ${buyerName},</h3>
            <p>Unfortunately, the seller was unable to verify your payment. Please review the reason below and try again.</p>
            <div class="rejection-badge">✗ Payment Not Verified</div>
          </div>

          <div class="reason-box">
            <h4>⚠️ Rejection Reason:</h4>
            <p>${rejectionReason || 'No specific reason provided. Please contact the seller for more information.'}</p>
          </div>

          <div class="section">
            <h4>📋 Payment Details</h4>
            <div class="details-grid">
              <div class="detail-item">
                <div class="label">Transaction ID</div>
                <div class="value" style="word-break: break-all; font-size: 0.9em;">${paymentDetails.transactionId}</div>
              </div>
              <div class="detail-item">
                <div class="label">Amount</div>
                <div class="value">₹${paymentDetails.totalAmount}</div>
              </div>
              <div class="detail-item">
                <div class="label">Crop</div>
                <div class="value">${paymentDetails.cropName}</div>
              </div>
              <div class="detail-item">
                <div class="label">Quantity</div>
                <div class="value">${paymentDetails.quantity} ${paymentDetails.cropUnit}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>💡 What You Can Do:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Contact the Seller:</strong> Reach out to the seller to understand why the payment was rejected</li>
              <li><strong>Try Again:</strong> Make sure to provide correct transaction details and a clear screenshot</li>
              <li><strong>Contact Support:</strong> If you need help, reach out to our support team</li>
            </ol>
          </div>

          <div class="section">
            <p>You can check your payment status and try submitting the payment again in your Payment History:</p>
            <a href="${process.env.CLIENT_URL}/buyer/payment-history" class="button">View Payment History</a>
          </div>

          <div class="footer">
            <p><strong>Need Help?</strong> Contact our support team or reach out to the seller directly.</p>
            <p>© ${new Date().getFullYear()} GardenShare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@gardenshare.com',
      to: buyerEmail,
      subject: `Payment Not Verified - Action Required | GardenShare`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Payment rejection email sent to ${buyerEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending payment rejection email:', error.message);
    return { success: false, error: error.message };
  }
};
