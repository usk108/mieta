// モーダルの定義の仕方
var mode_stt = {
	// モード名
	name: 'stt',
	// モード名(日本語)
	nameJapanese: '音声認識チャットモード',
	// 割り当てられたhtml
	view: null,
	// モード追加時に外部から与えられるモードの設定
	config: null,
	// 外部から変更できないモードの設定情報
	stable_config: {
		view: {
			width: 560,	//画面の横幅
			height: 300 	//画面の縦幅
		},
		btn: {
			needRun:true ,	//Runボタンが必要か
			needStop:true 	//Stopボタンが必要か
		}
	},

	//独自フィールド
	output_area : null,
	recognition : null,
	nowRecognition : false,
	runningRecId : null,

	init : function(modeconfig) {
		if (!('webkitSpeechRecognition' in window))
		    TextLogArea.log("Sorry. Web Speech API is not supported by this browser.(STT)");
		if (!('speechSynthesis' in window))
		    TextLogArea.log("Sorry. Web Speech API is not supported by this browser.(TTS)");

		this.recognition = new webkitSpeechRecognition();
		this.recognition.lang = "ja-JP";

		// 継続的に処理を行い、不確かな情報も取得可能とする.
		this.recognition.continuous = true;
		this.recognition.interimResults = true;

		//初期値falseだけど念のため明示的にfalseにする
		this.nowRecognition = false;

		this.attachEvents();
		this.arrangeView();

		console.log('initialized');
	},
	attachEvents : function() {
		var self = this;
		//これはなんのため？
		this.recognition.onaudioend = function() {
		    self.recognition.stop();
		    //setButtonForPlay()
		};

		this.recognition.onresult = function(event) {
            console.log('result is ...');
			var date_obj = new Date();
		    var results = event.results;

			if(self.runningRecId == null){
				self.runningRecId = FW.userID + '_' + date_obj.getTime().toString();
			}

			console.log(event);

			var message = {
				recId : self.runningRecId,
				results : []
			};

			for (var i = event.resultIndex; i < results.length; i++) {
				var result = {
						text : results[i][0].transcript,
						confidence : results[i][0].confidence,
						isFinal : results[i].isFinal
					};

				message.results.push(result);

		        if (results[i].isFinal) {
					self.runningRecId = null;
		        }
			}

			console.log(message);
			self.sendToAll(JSON.stringify(message));
		};

		// this.recognition.onresult = function(event) {
		// 	console.log('result is ...');
		// 	var results = event.results;
		// 	for (var i = event.resultIndex; i < results.length; i++) {
		// 		if (results[i].isFinal) {
		// 			var message = results[i][0].transcript;
		// 			if (message != '') {
		// 				self.sendToAll(message);
		// 			}
		// 		}
		// 	}
		// };

		console.log('attached');
	},

	run : function() {
		console.log('start recognition');
	    this.recognition.start();
	    this.nowRecognition = true;
	},

	stop : function() {
	    this.recognition.stop();
	    this.nowRecognition = false;
	},

	receive : function(data) {
		// receive : function(message, userName) {
		console.log('receive in stt');
		console.log(data);
		// console.log(this.nowRecognition);

		data.body = JSON.parse(data.body);

		this.makeFukidashi(data);

		// var textLog = $('#console');
		// var p = $('<p>').attr('style','word-wrap: break-word;').html(data.body);
		// var div = $('<div>');
		// var wrapdiv = $('<div>');
        //
		// if(data.userName === FW.userID){
		// 	//吹き出し生成
		// 	div.attr('class','balloon balloon-2-right');
		// 	//それを中央寄りにする
		// 	wrapdiv.attr('class','wrap-right');
		// }else{
		// 	div.attr('class','balloon balloon-1-left');
		// 	wrapdiv.attr('class','wrap-left');
		// }
		// div.append(p);
		// wrapdiv.append(div);
		// textLog.append(wrapdiv);
        //
		// while (textLog.children().length > 25) {
		// 	textLog.children().first().remove();
		// }
		// textLog.scroll(textLog.prop('scrollHeight'));
	},
	sendToAll : function(message) {
		//todo:
		var message_obj = {
			userName: FW.userID,
			mode: this.name,
			body: message
		};
		console.log('sent to all from stt mode');
		FW.sendToAll(message_obj);
		//Chat.socket.send(message);
		console.log(message_obj);
	},
	arrangeView: function(){
		console.log('xmodal: arrange view');
		var text_console = $('<div>')
		.attr('id', 'console-container')
		.append($('<div>').attr('id', 'console'));

		$('.main_view', this.view).append(text_console);
	},
	makeFukidashi: function(data){
		console.log('data is ');
		console.log(data);

		if(document.getElementById(data.body.recId) != null){
			$('#'+data.body.recId).html(this.jointTexts(data.body.results));
			$('#console').animate({scrollTop: $('#console')[0].scrollHeight}, 'fast');
			return;
		}

		var textLog = $('#console');
		var p = $('<p>').attr('style','word-wrap: break-word;').attr('id', data.body.recId).html(this.jointTexts(data.body.results));
		var div_chat = $('<div>');
		var div_hukidashi = $('<div>');
		var wrapdiv = $('<div>');

		console.log("userName is " + data.userName);
		console.log("FW.userID is " + FW.userID);

		if(data.userName === FW.userID){
			console.log("i'm speaking");
			//吹き出し生成
			div_chat.attr('class','chat-area');
			div_hukidashi.attr('class','chat-my-hukidashi');
			//それを中央寄りにする
			wrapdiv.attr('class','wrap-right');
			div_hukidashi.append(p);
			div_chat.append(div_hukidashi);
			wrapdiv.append(div_chat);
		}else{
			console.log("someone is speaking");
			var div_face = $('<div>').attr('class', 'chat-face');

			var img_url = './assets/images/tmp/hatena.jpg';
			if(data.userName in FW.user_img){
				img_url = FW.user_img[data.userName];
			}

			var img_face = $('<img>')
				.attr('width', '60')
				.attr('height', '60')
				.attr('src', img_url);

			div_chat.attr('class','chat-area');
			div_hukidashi.attr('class','chat-hukidashi someone');
			wrapdiv.attr('class','wrap-left');
			div_hukidashi.append(p);
			div_chat.append(div_hukidashi);
			div_face.append(img_face);
			wrapdiv.append(div_face).append(div_chat);
		}

		textLog.append(wrapdiv);

		// while (textLog.children().length > 25) {
		// 	textLog.children().first().remove();
		// }

		textLog.scroll(textLog.prop('scrollHeight'));
		$('#console').animate({scrollTop: $('#console')[0].scrollHeight}, 'fast');
	},

	jointTexts: function(results){
		var sentence = '';
		for(var i = 0; i < results.length; i++){
			sentence += results[i].text;
		}
		console.log('[DEBUG]joint texts are ' + sentence);
		return sentence;
	}

};
