Build one n8n workflow called "GymFlow - deliver WhatsApp messages".

PURPOSE
My gym-management web app queues WhatsApp messages in a database outbox. This workflow runs on a schedule, fetches the queued messages from my app's API, sends each one through the WhatsApp Cloud API, and reports back to my app whether each send succeeded or failed.

CONFIG (put these in the first "Set" node named "Config" so they are easy to edit; every later node must read them from there, never hardcode them)
- app_url: https://YOUR-APP-URL   (no trailing slash)
- app_secret: YOUR_SECRET
- whatsapp_phone_number_id: YOUR_PHONE_NUMBER_ID

TRIGGERS (two triggers into the same flow)
1. Schedule Trigger: every day at 09:00, timezone Asia/Kolkata. Its first action is an extra HTTP step (step A below) that asks my app to prepare the day's invoices and reminders. Then it continues into step B.
2. Schedule Trigger: every hour between 09:00 and 21:00, timezone Asia/Kolkata (cron "0 9-21 * * *"). It goes straight to step B.
Both triggers connect to "Config" first, then continue as described.

STEPS
A. (daily trigger only) HTTP Request, POST {{app_url}}/api/cron/daily
   Header: Authorization = Bearer {{app_secret}}
   No body. Then continue to step B.

B. HTTP Request, GET {{app_url}}/api/automation/outbox?limit=50
   Header: Authorization = Bearer {{app_secret}}
   Response shape: { "messages": [ { "id": "uuid", "to_phone": "919876543210", "template": "reminder", "params": ["Rahul","Iron Gym","₹1,500","7 Nov 2026","https://pay.link"], "body": "plain text", "kind": "r0" } ] }
   The array may be empty. In that case the workflow must stop cleanly without error.

C. Split Out the "messages" array so there is one item per message. Then Loop Over Items with batch size 1.

D. For each message, HTTP Request, POST https://graph.facebook.com/v21.0/{{whatsapp_phone_number_id}}/messages
   Authentication: Header Auth credential (name "Authorization", value "Bearer <WhatsApp Cloud API token>"). Create a placeholder credential called "WhatsApp Cloud API" and I will fill in the token.
   JSON body:
   {
     "messaging_product": "whatsapp",
     "to": <to_phone>,
     "type": "template",
     "template": {
       "name": <template>,
       "language": { "code": "en" },
       "components": [ { "type": "body", "parameters": <params mapped to [{ "type": "text", "text": "<value as string>" }, ...]> } ]
     }
   }
   IMPORTANT: set the node option so it does NOT fail the workflow on a non-2xx response. Use "Never Error" with the full response (status code and body) returned, because one failed message must not stop the rest.

E. HTTP Request, POST {{app_url}}/api/automation/outbox/ack
   Header: Authorization = Bearer {{app_secret}}
   JSON body:
   { "id": <the message id from the current loop item>, "status": "sent" if the WhatsApp status code is 2xx otherwise "failed", "error": <the WhatsApp response body as a string, only when failed> }
   Then loop back to Loop Over Items for the next message.

RULES
- Use the current n8n node versions and expression syntax ({{ }}).
- Name every node clearly (Config, Create invoices and queue reminders, Fetch queued messages, One item per message, Loop over messages, Send WhatsApp template, Report result to GymFlow).
- Add a sticky note explaining: "The app decides who gets which message and when; this workflow only delivers them and reports the result."
- Add an Error Trigger path or a note suggesting I enable "Error Workflow" so I am told if the whole run fails.
- Do not activate the workflow. Leave it inactive so I can test it first.
