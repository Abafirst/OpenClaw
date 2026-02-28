const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Telegram Bot credentials
const TELEGRAM_BOT_TOKEN = '8763805354:AAFQ11ktuQz1jIiKTtPyRbBPxZBj-C9U9mk';
const TELEGRAM_CHAT_ID = '8244331082';

// Middleware to parse JSON
app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const event = req.body;
  
  console.log('📨 GitHub Webhook Event Received:');
  console.log(JSON.stringify(event, null, 2));
  
  // Determine event type and create message
  let message = '';
  
  if (event.action === 'opened' && event.pull_request) {
    // PR opened
    const pr = event.pull_request;
    message = `🔔 <b>Pull Request Opened!</b>\n\n`;
    message += `<b>Title:</b> ${pr.title}\n`;
    message += `<b>Author:</b> ${pr.user.login}\n`;
    message += `<b>Branch:</b> ${pr.head.ref} → ${pr.base.ref}\n`;
    message += `<b>URL:</b> <a href="${pr.html_url}">View PR</a>`;
  } 
  else if (event.action === 'closed' && event.pull_request) {
    // PR closed/merged
    const pr = event.pull_request;
    const status = pr.merged ? '✅ MERGED' : '❌ CLOSED';
    message = `${status}\n\n`;
    message += `<b>Title:</b> ${pr.title}\n`;
    message += `<b>Author:</b> ${pr.user.login}\n`;
    message += `<b>URL:</b> <a href="${pr.html_url}">View PR</a>`;
  }
  else if (event.action === 'created' && event.comment && event.issue) {
    // Comment on issue/PR
    message = `💬 <b>New Comment</b>\n\n`;
    message += `<b>Author:</b> ${event.comment.user.login}\n`;
    message += `<b>Comment:</b> ${event.comment.body}\n`;
    message += `<b>URL:</b> <a href="${event.comment.html_url}">View Comment</a>`;
  }
  else if (event.ref && event.created) {
    // Push event
    message = `📤 <b>Push to ${event.ref.split('/').pop()}</b>\n\n`;
    message += `<b>Repository:</b> ${event.repository.name}\n`;
    message += `<b>Commits:</b> ${event.size}\n`;
    message += `<b>Pusher:</b> ${event.pusher.name}`;
  }
  else {
    // Generic event
    message = `📬 <b>GitHub Event Received</b>\n\n`;
    message += `<b>Event Type:</b> ${req.headers['x-github-event']}\n`;
    message += `<b>Repository:</b> ${event.repository ? event.repository.name : 'Unknown'}`;
  }
  
  // Send to Telegram if we have a message
  if (message) {
    sendTelegramMessage(message);
  }
  
  // Send response back to GitHub
  res.status(200).json({ success: true, message: 'Webhook received' });
});

// Function to send message to Telegram
async function sendTelegramMessage(text) {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      }
    );
    console.log('✅ Telegram message sent successfully!');
    console.log(`Message ID: ${response.data.result.message_id}`);
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error.response?.data || error.message);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook receiver is running on http://localhost:${PORT}`);
  console.log(`📨 Listening for GitHub webhooks at http://localhost:${PORT}/webhook`);
  console.log(`✅ Telegram notifications enabled!`);
});
