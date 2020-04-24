
# rocket-chat-daily-checkin-checkout

Bot to get check-in and checkout. Results will be posted inside channel. Late check-in and checkout will be posted separately.

## Project setup
1. Run this command
```
npm install
```
2. Change BOT_NAME for bot identification
3. Change ROCKETCHAT_ROOM for rooms name where bot will post user's stand-up
4. BOT_TIME_DIALOG_CHECKIN for check-in time. (Example : '09:00:00)
5. BOT_TIME_PUBLISH_CHECKIN for checkout time. (Example : '10:00:00)
6. BOT_TIME_DIALOG_CHECKOUT for check-in time. (Example : '09:00:00)
7. BOT_TIME_PUBLISH_CHECKOUT for checkout time. (Example : '10:00:00)
8. change ROCKETCHAT_URL for bot server. (Example: https://chat.example.com)
9. ROCKETCHAT_USER for rocketchat username login
10. ROCKETCHAT_PASSWORD for rocketchat password login

### Compiles for development
```
npm run watch
```
or you can use
```
npm run debug
```

### Compiles for production
```
npm run chatbot
```
