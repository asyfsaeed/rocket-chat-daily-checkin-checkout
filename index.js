require('dotenv').config();

const rocket = require('@rocket.chat/sdk'),
    respmap = require('./reply'),
    moment = require('moment');


//Envoirment Variables Reading
const HOST = process.env.ROCKETCHAT_URL,
    USER = process.env.ROCKETCHAT_USER,
    PASS = process.env.ROCKETCHAT_PASSWORD,
    BOTNAME = process.env.BOT_NAME,
    SSL = process.env.ROCKETCHAT_USE_SSL,
    ROOMS = [process.env.ROCKETCHAT_ROOM];

let time = {
    dialog: process.env.BOT_TIME_DIALOG_CHECKIN,
    publish: process.env.BOT_TIME_PUBLISH_CHECKIN,
    dialog2: process.env.BOT_TIME_DIALOG_CHECKOUT,
    publish2: process.env.BOT_TIME_PUBLISH_CHECKOUT
}
let channelId = '',
    users = [],
    submittedCheckIn = [],
    submittedCheckOut = [],
    UserData;

const runBot = async () => {
    //connection to workspace
    await rocket.driver.connect({host: HOST, useSsl: SSL});

    UserData = await rocket.driver.login({username: USER, password: PASS});

    await rocket.driver.joinRooms(ROOMS);

    await rocket.driver.subscribeToMessages();

    await rocket.driver.reactToMessages(processMessages);
}

const processMessages = async (err, message, messageOptions) => {

    if (!err && moment().format('dddd') != 'Sunday') {

        if (message.u._id === UserData) return;

        const roomName = await rocket.driver.getDirectMessageRoomId(message.u.username)

        if (message.msg.toLowerCase() && message.rid == roomName) {

            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

            console.log('Got Direct Message from ' + message.u.username);

            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

            let response;

            let inComingMessage = message.msg.toLowerCase();

            let currentTime = moment().format('HH:mm:ss');

            if (currentTime > time.dialog && currentTime < time.publish) {
                let indexSubmit = findInCheckIn(message.u.username);

                if (indexSubmit === -1) {
                    submittedCheckIn.push({
                        user: message.u,
                        checkInMessage: inComingMessage,
                        checkInMessageTime: moment().utcOffset(300).format('HH:mm:ss'),
                    });

                    response = respmap.thank;
                }
            } else if (currentTime > time.dialog2 && currentTime < time.publish2) {
                let indexSubmit = findInCheckOut(message.u.username);

                if (indexSubmit === -1) {
                    submittedCheckOut.push({
                        user: message.u,
                        checkOutMessage: inComingMessage,
                        checkOutMessageTime: moment().utcOffset(300).format('HH:mm:ss'),
                        blockerMessage: '',
                        blockerMessageTime: ''
                    });

                    response = respmap.blocking;
                } else if (!submittedCheckOut[indexSubmit].blockerMessage) {
                    submittedCheckOut[indexSubmit].blockerMessage = inComingMessage;
                    submittedCheckOut[indexSubmit].blockerMessageTime = moment().utcOffset(240).format('HH:mm:ss');
                    response = respmap.thank;
                }
            } else if (currentTime > time.publish && currentTime < time.dialog2) {
                rocket.driver.sendMessage({

                    rid: channelId,

                    msg: 'Hey HR, @' + message.u.name + ' has submitted a late check-in\n' +

                        '**1. What will you do today?**\n' +

                        '> ' + inComingMessage + '\n'
                }).then(response => {

                    response = respmap.thank;

                }).catch(error => {

                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

                    console.log('Error send message to channel');

                    console.log(error);

                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

                });
            } else if (currentTime > time.publish2 && currentTime < time.publish) {
                rocket.driver.sendMessage({

                    rid: channelId,

                    msg: 'Hey HR, @' + message.u.name + ' has submitted a check-out\n' +

                        '**1. What did you do today?**\n' +

                        '> ' + inComingMessage + '\n'
                }).then(response => {

                    response = respmap.thank;

                }).catch(error => {

                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')

                    console.log('Error send message to channel')

                    console.log(error)

                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')

                });
            }

            await rocket.driver.sendToRoom(response, roomName);

        }
    }

}

function getChannelMemberList() {
    rocket.api.get('channels.members', {
        roomId: channelId
    }).then(response => {
        users = [];
        response.members.forEach(user => {
            if (!user.username.toLowerCase().includes('bot')) {
                users.push(user);
            }
        })
    }).catch(error => {
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        console.log('Error when get channel member list :');
        console.log(error);
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    });
}

function findInCheckIn(username) {
    let response = submittedCheckIn.find(submit => {
        return submit.user.username == username
    });
    return submittedCheckIn.indexOf(response);
}

function findInCheckOut(username) {
    let response = submittedCheckOut.find(submit => {
        return submit.user.username == username
    });
    return submittedCheckOut.indexOf(response);
}

rocket.api.get('channels.list')
    .then(response => {
        response.channels.forEach(channel => {
            console.log(ROOMS.indexOf(channel.name))
            if (ROOMS.indexOf(channel.name) >= 0) {
                channelId = channel._id
            }
        });
        getChannelMemberList();
    });

setInterval(() => {
    if (moment().format('HH:mm:ss') == time.dialog && moment().format('dddd') != 'Sunday') {
        users.forEach(user => {
            if (user.username) {
                rocket.driver.getDirectMessageRoomId(user.username)
                    .then(userRoomId => {
                        rocket.driver.sendMessage({
                            rid: userRoomId,
                            msg: 'Hi, ' + user.name + '. What will you do today?'
                        });
                    }).catch(error => {
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    console.log('Error when send DM to ' + user.name);
                    console.log(error);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                });
            }
        });
    }

    if (moment().format('HH:mm:ss') == time.dialog2 && moment().format('dddd') != 'Sunday') {
        users.forEach(user => {
            if (user.username) {
                rocket.driver.getDirectMessageRoomId(user.username)
                    .then(userRoomId => {
                        rocket.driver.sendMessage({
                            rid: userRoomId,
                            msg: 'Hi, ' + user.name + '. What did you do today?'
                        });
                    }).catch(error => {
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    console.log('Error when send DM to ' + user.name);
                    console.log(error);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                });
            }
        })
    }

    if (moment().format('HH:mm:ss') == time.publish && moment().format('dddd') != 'Sunday') {
        let checkInMessage = '',
            unSubmitted = '';

        users.forEach(user => {
            if (findInCheckIn(user.username) < 0) {
                unSubmitted += ' @' + user.username
            }
        })

        if (unSubmitted.length > 0) {
            unSubmitted = "i didn't hear from" + unSubmitted
        }

        submittedCheckIn.forEach(submit => {
            checkInMessage += '> ' + submit.user.name + '\n' + '> ' + submit.checkInMessage + '( ' + submit.checkInMessageTime + '  )\n' + '** ** \n';
        });

        rocket.driver.sendMessage({
            rid: channelId,
            msg: 'Hey, @here our check-in for today :coffee:\n' +
                '**1. What will you do today?**\n' +
                checkInMessage +
                unSubmitted
        }).then(response => {
            submittedCheckIn = [];
        }).catch(error => {
            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
            console.log('Error when sending message to channel :');
            console.log(error);
            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        });

    }

    if (moment().format('HH:mm:ss') == time.publish2 && moment().format('dddd') != 'Sunday') {
        let checkOutMessage = '',
            unSubmitted = '',
            blockerMessage = ''

        users.forEach(user => {
            if (findInCheckOut(user.username) < 0) {
                unSubmitted += ' @' + user.username
            }
        });

        if (unSubmitted.length > 0) {
            unSubmitted = "i didn't hear from" + unSubmitted
        }

        submittedCheckOut.forEach(submit => {
            checkOutMessage += '> ' + submit.user.name + '\n' + '> ' + submit.checkOutMessage + '( ' + submit.checkOutMessageTime + '  )\n' + '** ** \n';
            blockerMessage += '> ' + submit.user.name + '\n' + '> ' + submit.blockerMessage + '( ' + submit.blockerMessageTime + '  )\n' + '** ** \n';
        });

        rocket.driver.sendMessage({
            rid: channelId,
            msg: 'Hey, @here our check-out for today:\n' +
                '**1. What did you do today?**\n' +
                checkOutMessage +
                '**2. Anything is blocking your progress?**\n' +
                blockerMessage +
                blockerMessage
        }).then(response => {
            submittedCheckOut = [];
        }).catch(error => {
            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
            console.log('Error when sending message to channel :');
            console.log(error);
            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        })

    }
}, 1000)


runBot();
