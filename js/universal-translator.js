var recording = false;
var recognition;
var finalTranscript = '';

var inputLanguage = {
    en: {recCode: 'en-US', translateCode: 'en'},
    fr: {recCode: 'fr-FR', translateCode: 'fr'},
    it: {recCode: 'it-IT', translateCode: 'it'},
    es: {recCode: 'es-AR', translateCode: 'es'}
};

var speaking;
var languageInput = inputLanguage['en'];

function selectVoice(voiceIndex) {
    speaking = window.speechSynthesis.getVoices()[voiceIndex];
}

$(document).ready(function() {

    languageInput = inputLanguage['en'];

    try {
        if (!(window.speechSynthesis)) {
            $('.upgrade').show();
        }
        recognition = new webkitSpeechRecognition();
    }
    catch (e) {
        $('.upgrade').show();
    }

    $(".languageSpoken" ).change(function() {
        var voiceIndex = $('.languageSpoken option:selected').val();
        selectVoice(voiceIndex);
    });

    $(".languageInput" ).change(function() {
        languageInput = inputLanguage[$('.languageInput option:selected').val()];
        recognition.lang = languageInput.recCode;
    });

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = speechRecognition;
});

$(document).on("keyup keydown", function(e) {
    if(e.shiftKey) {
        if(!recording) {
            recording = true;
            recognition.start();
        }
    }
    else {
        recording = false;
        recognition.stop();
    }
});

//speech recognition
var speechRecognition = function(event) {
    var interimTranscript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        interimTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            talkToMe(interimTranscript);
        }
    }
    $('.result').text(interimTranscript);
};

//speak it back to me
var talkToMe = function(text) {
    recording = false;
    recognition.stop();
    google.language.translate(
        {text : text, type : google.language.ContentType.TEXT},
        languageInput.translateCode,
        //grab just the language from the code.
        speaking.lang.split('-')[0],
        function(result) {
            var msg = new SpeechSynthesisUtterance();
            msg.voice = speaking;
            msg.text = result.translation;
            window.speechSynthesis.speak(msg);
            $('.translation').text(result.translation);
        }
    )
};

//google translate from source to target language
var callbackCount = 0;
var google  = {
    key: "<add_your_own_google_translate_api_key>",
    endpoint: "https://www.googleapis.com/language/translate/v2",
    language: {
        ContentType: {TEXT: "text"},
        translate: function(options, sourceCode, targetCode, callback) {
            var callbackName = "callback" + callbackCount;
            var localCallbackWrapper = function(resp) {
                callback({error: false, translation: resp.data.translations[0].translatedText});
            };
            google.language[callbackName] = localCallbackWrapper;
            callbackCount++;
            var newScript = document.createElement('script');
            newScript.type = 'text/javascript';
            var source = google.endpoint + "?key=" + google.key +
                "&source=" + sourceCode +
                "&target=" + targetCode +
                "&format=text" +
                "&q=" + encodeURI(options.text) +
                "&callback=google.language." + callbackName;
            newScript.src = source;
            document.getElementsByTagName('head')[0].appendChild(newScript);
        }
    }
};

//voices are loaded async
window.speechSynthesis.onvoiceschanged = function() {
    for (var i = 0; i < window.speechSynthesis.getVoices().length; i++ ) {
        var voice = window.speechSynthesis.getVoices()[i];
        var name = voice.name + " (" + voice.lang + ")";
        $('.languageSpoken').append($('<option>', {value: i, text: name}));
    }
    //select french to start
    if (speaking === undefined) {
        selectVoice(6);
        $('.languageSpoken').val(6);
    }
};
