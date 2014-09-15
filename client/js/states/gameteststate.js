'use strict';

/*
This gamestate fakes the login screen by doing all the networking,
and then jumps you immediately to the GameState state.
 */

function GameTestState() {
}

GameTestState.prototype.prepare = function(callback) {
  callback();
};

GameTestState.prototype.enter = function() {
  // Grab user/pass from local storage
  var rUser = localStorage.getItem('roseuser');
  var rPass = localStorage.getItem('rosepass');

  // Help out by setting some initial but blank entries.
  if (!rUser) {
    localStorage.setItem('roseuser', '');
  }
  if (!rPass) {
    localStorage.setItem('rosepass', '');
  }

  // Make sure we have some user details
  if (!rUser || !rPass) {
    console.warn('You must specify roseuser and rosepass in LocalStorage!');
    return;
  }

  var waitDialog = MsgBoxDialog.create('Connecting...', false);

  netLogin = new LoginClient();
  netLogin.connect('128.241.92.36', 29000, function(err) {
    waitDialog.setMessage('Connected; Logging In.');

    netLogin.login(rUser, rPass, function (data) {
      if ((data.result & 0x7f) !== NETLOGINREPLY.OK) {
        waitDialog.setMessage('Failed to Login (' + enumToName(NETLOGINREPLY, data.result) + ').');
        netLogin.end();
        return;
      }
      waitDialog.setMessage('Logged In; Finding Server.');

      var serverIdx = -1;
      for (var i = 0; i < data.servers.length; ++i) {
        var tServer = data.servers[i];
        if (tServer.name === '1Draconis') {
          serverIdx = tServer.id;
          break;
        }
      }

      if (serverIdx < 0) {
        waitDialog.setMessage('Failed to find a server.');
        netLogin.end();
        return;
      }

      netLogin.channelList(serverIdx, function (data) {
        waitDialog.setMessage('Found Server; Retrieving endpoint info.');

        var channelIdx = -1;
        for (var j = 0; j < data.channels.length; ++j) {
          var tChannel = data.channels[j];
          if (tChannel.name === 'Channel 1') {
            channelIdx = tChannel.id;
          }
        }

        if (channelIdx < 0) {
          waitDialog.setMessage('Failed to find a channel.');
          netLogin.end();
          return;
        }

        netLogin.selectServer(tServer.id, tChannel.id, function (data) {
          waitDialog.setMessage('Found Endpoint; Connecting to World Server.');
          netLogin.end();

          netWorld = new WorldClient();
          netWorld.connect(data.worldIp, data.worldPort, data.transferKey1, rPass, function () {
            waitDialog.setMessage('Connected to World Server.  Loading characters.');

            netWorld.characterList(function (data) {
              waitDialog.setMessage('Loaded characters; Selecting one.');

              if (data.characters.length < 0) {
                waitDialog.setMessage('Failed to find a character.');
                netWorld.end();
                return;
              }

              var pickCharName = data.characters[0].name;
              netWorld.selectCharacter(pickCharName, function(data) {
                waitDialog.setMessage('Character Selected. Connecting to Game Server.');

                netGame = new GameClient();
                netGame.connect(data.gameIp, data.gamePort, data.transferKey1, rPass, function () {
                  waitDialog.setMessage('Connected to Game Server; Doing Something.');

                  // Not sure what to do from here yet!
                  //waitDialog.close();

                });
              });
            });
          });
        });
      });
    });
  });
};

GameTestState.prototype.leave = function() {

};

GameTestState.prototype.update = function(delta) {
};