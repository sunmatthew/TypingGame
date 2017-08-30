function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYabcdefghijklmnopqrstuvwxy0123456789";

	for (var i = 0; i < 10; i++)
	text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function addMessage(msg, name) {
	var table = document.getElementById('displayTable');
	var rowNum = table.rows.length;
	var row = table.insertRow(rowNum);

	var msgCell = row.insertCell(0);
	msgCell.innerHTML = '<strong>' + name + '</strong><br/>' + msg;

	var inputField = document.getElementById('textField');
	inputField.value = "";
}

function createRoomFirebase(name) {
	var ref = firebase.database().ref(name);
	ref.update({
		zstart: {
			username: "ROOM",
			message: "Your game has been created."
		},
		zzstart: {
			username: "ROOM",
			message: "Waiting for other players..."
		}
	});
	console.log("ROOM MADE");
	ref.on("child_added", function(snapshot, prevChildKey) {
		var newMsg = snapshot.val();
		// console.log("Username: " + newMsg.username);
		// console.log("Message: " + newMsg.message);
		// console.log("Previous Message ID: " + prevChildKey);
		addMessage(newMsg.message, newMsg.username);
	});
}

function roomExists(room) {
	var ref = firebase.database().ref(room);
	console.log("REF MADE");
	ref.once("value").then(function(snapshot) {
		console.log("CHECKING FOR SNAPSHOT..");
		if (snapshot.exists()) {
			console.log("ROOM EXISTS");
			return true;
		} else {
			return false;
		}
	});
}

function userExists(username, room) {
	var ref = firebase.database().ref(room + " - users/" + username);
	ref.once("value").then(function(snapshot) {
		if (snapshot.exists()) {
			return true;
		} else {
			ref.update({
				status: "waiting"
			});
			return false;
		}
	});
}

function getUserReady(username, room) {
	var ref = firebase.database().ref(room + " - users");
	ref.update({
		[username]: {
			status: "ready"
		}
	});

	var refRoom = firebase.database().ref(room);
	var msgId = makeid();
	refRoom.update({
		[msgId]: {
			username: "ROOM",
			message: username + " is ready to play."
		}
	});
}

function userCancelReady(username, room) {
	var ref = firebase.database().ref(room + " - users");
	ref.update({
		[username]: {
			status: "waiting"
		}
	});

	var refRoom = firebase.database().ref(room);
	var msgId = makeid();
	refRoom.update({
		[msgId]: {
			username: "ROOM",
			message: username + " was removed from play."
		}
	});
}







document.getElementById('sendButton').addEventListener("click", function () {
	var message = document.getElementById('textField').value;
	var room = $("#roomName").text();
	var username = $("#username").text();

	var ref = firebase.database().ref(room);
	var msgId = makeid();
	ref.update({
		[msgId]: {
			username: username,
			message: message
		}
	});
	// addMessage(message, name);
});

function sendMessage (input) {
	if (event.keyCode == 13) {
		var message = document.getElementById('textField').value;
		var room = $("#roomName").text();
		var username = $("#username").text();

		var ref = firebase.database().ref(room);
		var msgId = makeid();
		ref.update({
			[msgId]: {
				username: username,
				message: message
			}
		});
		input.value="";
	}
}

document.getElementById('createRoomButton').addEventListener("click", function() {
	$("#homeContainer").hide();
	$("#createRoomContainer").show();
});

document.getElementById('confirmRoomCreateButton').addEventListener("click", function () {
	var roomName = document.getElementById('createRoomNameField');
	var username = document.getElementById('createRoomNameUserNameField');

	if (roomName.value == "" || username.value == "") {
		alert("Empty fields!");
	} else {
		var roomNameValue = roomName.value;
		var usernameValue = username.value;

		$("#createRoomContainer").hide();
		$("#messageContainer").show();


		$("#roomName").html(roomNameValue);
		$("#username").html(usernameValue);

		userExists(usernameValue, roomNameValue);
		createRoomFirebase(roomNameValue);
	}
});

document.getElementById('joinRoomButton').addEventListener("click", function() {
	$("#homeContainer").hide();
	$("#joinRoomContainer").show();
});

document.getElementById('confirmJoinRoom').addEventListener("click", function() {
	var roomName = document.getElementById('joinRoomNameField');
	var username = document.getElementById('joinRoomUserNameField');

	if (roomName.value == "" || username.value == "") {
		alert("Empty fields!");
	} else {
		var roomNameValue = roomName.value;
		var usernameValue = username.value;

		$("#roomName").html(roomNameValue);
		$("#username").html(usernameValue);

		if (userExists(usernameValue, roomNameValue)) {
			alert("User already exists!");
		} else {
			var msgId = makeid();
			var ref = firebase.database().ref(roomNameValue);
			ref.set({
				[msgId]: {
					username: "ROOM",
					message: usernameValue + " has joined the room."
				}
			});
			ref.on("child_added", function(snapshot, prevChildKey) {
				var newMsg = snapshot.val();
				console.log("Username: " + newMsg.username);
				console.log("Message: " + newMsg.message);
				console.log("Previous Message ID: " + prevChildKey);
				addMessage(newMsg.message, newMsg.username);
			});

			$("#joinRoomContainer").hide();
			$("#messageContainer").show();
		}
		
	}
});

var ready = false;
$("#readyUp").click(function() {
	var room = $("#roomName").text();
	var username = $("#username").text();
	if (ready) {
		$(this).css('background-color', '#448AFF');
		ready = false;
		userCancelReady(username, room);
	} else {
		$(this).css('background-color', '#43A047');
		ready = true;
		getUserReady(username, room);
	}
});





function getReadyUsers(room) {
	var ref = firebase.database().ref(room + " - users");
	var playerRef = firebase.database().ref(room + " - userLife");
	ref.once("value").then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			var username = childSnapshot.key;
			var status = childSnapshot.val().status;

			if (status == "ready") {
				playerRef.update({
					[username]: {
						health: "100"
					}
				});
			}
		});
	});
}

function updatePlayerTable(room) {
	var ref = firebase.database().ref(room + " - userLife");

	var table = document.getElementById('playerTable');
	table.innerHTML = "";

	ref.once("value").then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			var username = childSnapshot.key;
			var health = childSnapshot.val().health;

			var rowNum = table.rows.length;
			var row = table.insertRow(rowNum);

			var nameCell = row.insertCell(0);
			nameCell.innerHTML = username;
			var hpCell = row.insertCell(1);
			hpCell.innerHTML = health;
		});
	});
}

function getCurrentHP(room, username) {
	var ref = firebase.database().ref(room + " - userLife");
	ref.once("value").then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			console.log(username);
			console.log(childSnapshot.key);
			console.log(childSnapshot.val().health);
			if (username == childSnapshot.key) {
				return childSnapshot.val().health;
			}
		});
	});
}


var wordsTyped = [];
function sendDefMsg(input) {
	if (event.keyCode == 13) {
		var message = document.getElementById('defTextField').value;
		wordsTyped.push(message);
		input.value="";
	}
}

function removeFromArray(array, element) {
	var index = array.indexOf(element);
	if (index > -1) {
		array.splice(index, 1);
	}
}

function dealDmg(room, username, message) {
	var ref = firebase.database().ref(room + " - userLife");
	ref.once("value").then(function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
			console.log("USER NAME " + username);
			console.log(childSnapshot.key);
			console.log("OLD HP " + childSnapshot.val().health);
			if (username == childSnapshot.key) {
				var dmg = message.length;
				var newHp = childSnapshot.val().health - dmg;
				console.log("NEW HP " + newHp);
				ref.update({
					[username]: {
						health: newHp
					}
				});
			}
		});
	});
}

function readHPChange(room) {
	var ref = firebase.database().ref(room + " - userLife");
	ref.on("child_changed", function(snapshot) {
		updatePlayerTable(room);
	});
}

$("#startGame").click(function() {
	$("#messageContainer").hide();
	$("#gameContainer").show();

	var room = $("#roomName").text();
	var username = $("#username").text();

	getReadyUsers(room);
	updatePlayerTable(room);
	startReadingGameMsg(room, username);
	readHPChange(room);
});

function addAttackMsgToGame(message, username) {
	var table = document.getElementById('gameConsole');
	var rowNum = table.rows.length;
	var row = table.insertRow(rowNum);

	var msgCell = row.insertCell(0);
	var id = makeid();
	var attackId = makeid();
	msgCell.innerHTML = '<strong class="attack" id="' + attackId +  '">' + message + '</strong>';
	var countdownCell = row.insertCell(1);
	countdownCell.innerHTML = '<span id="' + id + '">10</span>';

	var timeleft = 10;
	var timer = setInterval(function() {
		timeleft --;
		document.getElementById(id).textContent = timeleft;
		if (timeleft <= 0) {
			clearInterval(timer);
			countdownCell.innerHTML = "";

			var room = $("#roomName").text();
			dealDmg(room, username, message);
		} else {
			if (wordsTyped.indexOf(message) != -1) {
				clearInterval(timer);
				countdownCell.innerHTML = "";
				row.deleteCell(1);
				msgCell.innerHTML = '<strong id="msg">' + message + '</strong>';
				removeFromArray(wordsTyped, message);
			}
		}
	}, 1000);
}	

function addMsgToGame(message, username) {
	var table = document.getElementById('gameConsole');
	var rowNum = table.rows.length;
	var row = table.insertRow(rowNum);

	var msgCell = row.insertCell(0);
	msgCell.innerHTML = '<strong id="msg">' + message + '</strong>';
}

function sendAttackMsg(input) {
	if (event.keyCode == 13) {
		var message = document.getElementById('attackTextField').value;
		var room = $("#roomName").text();
		var username = $("#username").text();

		var key = "dict.1.1.20170829T191224Z.dd950df831edfd96.8a1c7561833e79a571bf7cfafbb14326b8575c53";
		var url = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=" + key + "&lang=en-ru&text=" + message;

		$.ajax({
			url:url,
			dataType:'json',
			type:'get',
			success:function(response) {
				if (response.def != "") {
					var ref = firebase.database().ref(room + " - gameMsg");
					var msgId = makeid();
					ref.update({
						[msgId]: {
							username: username,
							message: message
						}
					});
					input.value="";
				} else {
					alert("Word doesn't exist!");
				}
			},
			error: function(reponse) {
				console.log(response);
			}
		});
	}
}

function startReadingGameMsg(room, username) {
	var ref = firebase.database().ref(room + " - gameMsg");
	ref.on("child_added", function(snapshot, prevChildKey) {
		var newMsg = snapshot.val();
		// console.log("Username: " + newMsg.username);
		// console.log("Message: " + newMsg.message);
		// console.log("Previous Message ID: " + prevChildKey);
		console.log(newMsg);
		if (newMsg.username == username) {
			addMsgToGame(newMsg.message, newMsg.username);
		} else {
			addAttackMsgToGame(newMsg.message, username);
		}
	});
}

