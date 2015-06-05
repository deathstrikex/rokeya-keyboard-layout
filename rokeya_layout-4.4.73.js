/*
version: 4.4.73
author: seoul
released as apache 2.0 license.

unicode values taken from this link: http://tlt.its.psu.edu/suggestions/international/bylanguage/bengalichart.html
Keyboard.prototype.cursorPosition, Keyboard.prototype.writeFinalValue function(s) are taken from www
*/
function banglaLayout(id) {
    var inputbox = document.getElementById(id);
    var keyboard = new Keyboard();

    try {
        inputbox.onkeydown = function (keyEvent) {
            if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent))
                return true;

            var oEvent = window.event || keyEvent;
            var oSource = oEvent.srcElement || oEvent.target;
            this.returnValue = keyboard.handleKeyboardInput(oEvent, oSource);
            return this.returnValue;
        }
        inputbox.onkeypress = function (keyEvent) {
            if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
                var oEvent = window.event || keyEvent;
                var oSource = oEvent.srcElement || oEvent.target;
                this.returnValue = keyboard.handleKeyboardInput(oEvent, oSource);
            }
            return this.returnValue;
        }
        inputbox.onkeyup = function (keyEvent) {
            if (!!keyEvent)
                keyEvent.preventDefault();
        }
    } catch (e) {
        if (console)
            console.log(e.message);
    }
    this.sourceField = id;
    return this;
}
banglaLayout.prototype.main = function (keyEvent, keyboard) {
    var oEvent = window.event || keyEvent;
    var oSource = oEvent.srcElement || oEvent.target;
    return keyboard.handleKeyboardInput(oEvent, oSource);
}
banglaLayout.prototype.loadHelpTooltip = function () {
    try {
        if (!jQuery)
            return this;

        var $sourceField = document.getElementById(this.sourceField);
        var toolTipText = "ctrl+m অথবা F9 চেপে বাংলা ও ইংরেজীতে সুইচ করতে পারবেন..\n..হ=H, ৎ=Z, ঙ=x, ঞ=X, ং=V, ঁ=B, ঃ=M";

        var $parent = jQuery("#" + this.sourceField);
        var left = $parent.position().left + $parent.width();
        left -= $parent.width() < 3 ? 0 : 3;
        var top = $parent.position().top;
        top += $parent.height() < 5 ? 0 : 5;

        var $tooltipDiv = document.createElement('abbr');
        $tooltipDiv.setAttribute("style", "width: 10px; position:absolute; cursor:help; color:red; left:" + (left) + "px;top:" + (top) + "px;");
        $tooltipDiv.innerHTML = "?";
        $tooltipDiv.setAttribute("title", toolTipText);
        $tooltipDiv.onmouseover = function () { };

        jQuery($tooltipDiv).insertAfter($parent);
        return this;
    } catch (e) {
        if (console)
            console.log(e.message);
    }
}


function Keyboard() {
    this.global = new Letter_Information();
}

Keyboard.prototype.handleKeyboardInput = function (oEvent, oSource) {

    this.textInputSource = oSource;
    this.oEvent = oEvent;

    var prev = "", prevPrev = "", next = "", nextNext = "", text = !!oSource ? this.textInputSource.value : this.text, prevCharacterType = 0;

    var keyState = this.selectKeyPressed();

    // <summary>Decision; Should script continue or not</summary>
    if (!!keyState.iShouldDealIt == false) return true;

    if (this.global.currentLanguage == "en_US") {
        return true;
    }

    // set previous and next characters
    if (keyState.placeTo >= 2) {
        prevPrev = text.charAt(keyState.placeTo - 2);
        prev = text.charAt(keyState.placeTo - 1);
        prevCharacterType = this.global.getFollower(prev, 1);
    }
    else if (keyState.placeTo == 1) {
        prev = text.charAt(keyState.placeTo - 1);
        prevCharacterType = this.global.getFollower(prev, 1);
    }
    if (keyState.placeTo >= 0 && keyState.placeTo <= text - 2) {
        nextNext = text.charAt(keyState.placeTo + 1);
        next = text.charAt(keyState.placeTo + 0);
    }
    else if (keyState.placeTo >= 0 && keyState.placeTo <= text.length - 1)
        next = text.charAt(keyState.placeTo + 0);


    /************************************** 
    unicodeKey change if necessary
    ***************************************/
    // consonant+h type input or hasanta pressed twice
    keyState.replaceLastChar = keyState.replaceLastChar || (prev == "\u09CD" && keyState.unicodeKey == "\u09CD");

    if (keyState.replaceLastChar) {
        // if hasanta then +
        if (prev == "\u09CD" && keyState.unicodeKey == "\u09CD") {
            keyState.unicodeKey = "\u002B";
        }
            // if hasanta and h then force end at hasanta
        else if (prev == "\u09CD" && keyState.unicodeKey == "") {
            keyState.unicodeKey = "\u09CD" + this.global.ZWNJ;
        }
            // other
        else if (prevCharacterType == 2)
            keyState.unicodeKey = this.global.getFollower(prev, 2);
        else if (prevCharacterType == 7)
            keyState.unicodeKey = this.global.ZWNJ + this.global.getFollower(prev, 2);
        else
            keyState.unicodeKey = this.global.getFollower(prev, 2);

        // if valid key reduce start position-1 because this will not be inserted
        if (keyState.unicodeKey.length > 0) {
            keyState.placeTo -= 1;
            keyState.position.start -= 1;
        }
    }

    // rab => r za-fola
    if (keyState.unicodeKey == "\u09cd\u09af" && prev == "\u09b0") {
        // grand hotel spelling
        if (keyState.position.start > 0 && this.global.getFollower(prevPrev, 1) == 4)
            keyState.unicodeKey = "\u09cd" + "\u09af";
        else {
            keyState.position.start -= 1;
            keyState.unicodeKey = "\u09b0" + this.global.ZWNJ + "\u09cd" + "\u09af";
        }
    }

    // same vowel pressed twice will cause a switch
    if (prev == keyState.unicodeKey && (prevCharacterType == 2 || prevCharacterType == 7)) {
        var temp = this.global.getSwitchedLetter(keyState.unicodeKey);
        // for "onamika" => no switch character because switching a character with same character insert nothing
        if (temp.length > 0) {
            keyState.position.start -= 1;
            keyState.unicodeKey = temp;
        }
        else
            keyState.unicodeKey = this.global.getFollower(keyState.unicodeKey, 2);
    }
        // change vowel in full-form to kar-form if prevCharacterType is not consonant/fola
    else if (keyState.characterType == 2 && !(prevCharacterType == 1 || prevCharacterType == 3)) {
        keyState.unicodeKey = this.global.getFollower(keyState.unicodeKey, 2);
    }

    // fullstop button pressed twice will cause a dot ..
    if (prev == "\u0964" && keyState.unicodeKey == "\u0964") {
        keyState.unicodeKey = "\u002E";
        keyState.position.start -= 1;
    }

    // <summary>Backspace or Delete</summary>
    // prevPrev is hasanta
    if (keyState.code == 8) {

        // if end==start then selected text so cursor should not move; otherwise should
        keyState.position.start -= +(keyState.position.start == keyState.position.end);

        if (prevPrev == "\u09CD" || prevPrev == this.global.ZWNJ)
            keyState.position.start -= 1;

        if (keyState.position.start < 0)
            keyState.position.start = 0;
    }
    // nextNext is hasanta
    if (keyState.code == 46) {

        // if end==start then selected text so cursor should not move; otherwise should
        keyState.position.end += +(keyState.position.start == keyState.position.end);
        keyState.position.end += nextNext == "\u09CD" ? 1 : 0;
    }

    // <summary>Final data preparation</summary>
    var firstPortion = text.slice(0, keyState.position.start);
    var lastPortion = text.slice(keyState.position.end);
    var finalText = firstPortion + keyState.unicodeKey + lastPortion;
    var caretPosition = keyState.position.start + keyState.unicodeKey.length;

    if (!oSource)
        return { text: finalText, caret: caretPosition, hookSuccessful: true };
    // <summary>Write final data and update caret</summary>
    this.writeFinalValue(finalText, caretPosition);

    return false;
}
// <summary>Select and return which key is pressed in iOS</summary>
Keyboard.prototype.select_iOS_KeyPressed = function () {
    var code = this.oEvent.keyCode || this.oEvent.which;
    var position = this.cursorPosition();
    var unicodeKey = "", iShouldDealIt = false;

    if (code >= 65 && code <= 90) {
        unicodeKey = this.global.letterKeyMap[code - 65][1];
    }
    else if (code >= 97 && code <= 122) {
        unicodeKey = this.global.letterKeyMap[code - 97][0];
    }
    else if (code >= 48 && code <= 57) {
        unicodeKey = this.global.numberKeyMap[code - 48][0];
    }

    var replaceLastChar = (unicodeKey == "" && code == 104);
    return {
        code: code,
        unicodeKey: unicodeKey,
        iShouldDealIt: unicodeKey != "" || replaceLastChar,
        placeTo: position.start,
        replaceLastChar: replaceLastChar,
        position: position
    }
}
// <summary>Select and return which key is pressed</summary>
Keyboard.prototype.selectKeyPressed = function () {
    var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
    if (iOS)
        return this.select_iOS_KeyPressed();

    var code = this.oEvent.keyCode || this.oEvent.which;
    var codeAsCharacter = String.fromCharCode(this.oEvent.keyCode || this.oEvent.which);
    var position = this.cursorPosition();

    // delete or backspace or dot-button or plus-button key
    if (code == 8 || code == 46) {
        return {
            code: code,
            unicodeKey: "",
            iShouldDealIt: true,
            placeTo: position.start,
            position: position
        }
    }

    // using ctrl+m or F9 button to language switched
    if ((this.oEvent.ctrlKey && code == 77) || code == 120) {
        var _C = this.global.currentLanguage == "bn_BD" ? "en_US" : "bn_BD";
        this.global.currentLanguage = _C;
    }
    //  ctrl, shift, alt, alt-grp, up arrow, down arrow
    if (this.oEvent.ctrlKey || this.oEvent.altKey || code < 32 || (code >= 37 && code <= 40)) {
        return {
            code: code,
            iShouldDealIt: false
        }
    }

    var unicodeKey = "";

    if (code >= 65 && code <= 90) {
        unicodeKey = this.global.letterKeyMap[code - 65][+!!this.oEvent.shiftKey];
    }
    else if (code >= 48 && code <= 57 && this.oEvent.shiftKey == false) {
        unicodeKey = this.global.numberKeyMap[code - 48][0];
    }
        // numpad numbers except opera
    else if (!window.opera && code >= 96 && code <= 105 && this.oEvent.shiftKey == false)
        unicodeKey = this.global.numberKeyMap[code - 96][0];
        // taka symbol
    else if (code == 52 && this.oEvent.shiftKey)
        unicodeKey = "\u09f3";

        // full-stop from keyboard/numpad	
    else if ((code == 190 || code == 110) && !this.oEvent.shiftKey)
        unicodeKey = '\u0964';
        // shift with plus-sign, replace with Q[0] or hasanta
    else if ((code == 107) && this.oEvent.shiftKey)
        unicodeKey = this.global.letterKeyMap[81 - 65][0];
        // shitexplorer tweak for + button
    else if (!!document.selection && !!document.selection.createRange && code == 187 && this.oEvent.shiftKey)
        unicodeKey = this.global.letterKeyMap[81 - 65][0];
        // opera,chrome 24+, firefox16+ tweak for + button
    else if ((code == 187 || code == 61) && this.oEvent.shiftKey)
        unicodeKey = this.global.letterKeyMap[81 - 65][0];
    else return {
        code: code,
        iShouldDealIt: false
    };

    // h || full-Stop || plus-Sign
    var replaceLastChar =
            (code == 72) && !this.oEvent.shiftKey;

    return {
        code: code, // =65
        iShouldDealIt: true, // =false

        unicodeKey: unicodeKey, // ="\u0041"
        shiftKeyPressed: this.oEvent.shiftKey, // =false        
        replaceLastChar: replaceLastChar, // =false
        placeTo: position.start, // =3
        position: position, // { 1,8 }
        characterType: this.global.getFollower(unicodeKey, 1) // 1~7
    };
}

// <summary>Write finalText to the text/input box</summary>
Keyboard.prototype.writeFinalValue = function (finalText, caretPosition) {

    var scrollTop = this.textInputSource.scrollTop;

    if (typeof this.textInputSource.selectionStart == "number" && typeof this.textInputSource.selectionEnd == "number") {

        // Non-IE browsers and IE 9
        this.textInputSource.value = finalText;
    }
    else if (document.selection && document.selection.createRange) {

        // For IE up to version 8
        //var selectionRange = document.selection.createRange();
        //var textInputRange = this.textInputSource.createTextRange();
        //var precedingRange = this.textInputSource.createTextRange();
        //var bookmark = selectionRange.getBookmark();
        //textInputRange.moveToBookmark(bookmark);
        //precedingRange.setEndPoint("EndToStart", textInputRange);
        //var start = precedingRange.text.length;
        //var end = start + selectionRange.text.length;
        //alert(start+" && "+end+" "+caretPosition);
        this.textInputSource.value = finalText;
        //caretPosition=end;
        /*
                var count=0;// finalText.search('\r\n');
                var i=0;
                while( i <caretPosition)
                {
                    var newLinePosition= finalText.substr(i).search('\r\n');
                    if(newLinePosition >=0)
                    {
                        i+=newLinePosition +1;
                        count+=1;
                    }
                    else
                        break;
                }
                finalText= finalText.replace("\r\n","\n");
                //caretPosition-=count;
        
                finalText= finalText.replace(/\s+$/,"");
                //if( finalText.charCodeAt(caretPosition)==13)
                //    finalText=finalText.substr(0, finalText.length-1);
        
                this.textInputSource.value = finalText;
        */
        //        // Move the caret
        //        textInputRange = this.createTextRange();
        //        textInputRange.collapse(true);
        //        textInputRange.move("character", start - (this.textInputRange.value.slice(0, start).split("\r\n").length - 1));
        //        textInputRange.select();
    }

    this.textInputSource.focus();
    this.textInputSource.scrollTop = scrollTop;

    // move caret
    if (this.textInputSource.setSelectionRange) {
        this.textInputSource.focus();
        this.textInputSource.setSelectionRange(caretPosition, caretPosition);
    }
    else if (this.textInputSource.createTextRange) {


        var range = this.textInputSource.createTextRange();
        range.collapse(true);
        range.moveEnd('character', caretPosition);
        range.moveStart('character', caretPosition);
        range.select();
    }
}

Keyboard.prototype.tinymceplugin = function (text, caretPosition, e) {
	if(text.charAt(caretPosition) == '<' && text.length == caretPosition+4 && (e.keyCode == 8 || e.keyCode == 46) )
		return true; // A delete is pressed at the end and tinymce itself will take care of it
	if( (text == '' || (caretPosition >0 && text.charAt(caretPosition-1) == '>')) && (e.keyCode == 8 || e.keyCode == 46) )
		return false; // Tinymce converts > to &lt; so it will never appear in text
		
    this.text = text;
    this.caretPosition = caretPosition;
    return this.handleKeyboardInput(e, null);
}

Keyboard.prototype.cursorPosition = function () {
    if (!!this.caretPosition)
        return {
            start: this.caretPosition,
            end: this.caretPosition
        };

    //var textarea = document.getElementById("myTextArea");
    var start = 0, end = 0;
    if (typeof this.textInputSource.selectionStart == "number"
        && typeof this.textInputSource.selectionEnd == "number") {
        // Non-IE browsers and IE 9
        start = this.textInputSource.selectionStart;
        end = this.textInputSource.selectionEnd;
    }
    else if (document.selection && document.selection.createRange && this.textInputSource.type == "textarea") {
        // For IE up to version 8
        var textarea = this.textInputSource;
        textarea.focus();
        /*
                var selection = document.selection.createRange();
        
                selection.moveStart('character', -this.textInputSource.value.length);
        
                start = selection.text.length;
                end = selection.text.length;
                alert("start: "+start+" and end: "+end);
        */

        var selection_range = document.selection.createRange().duplicate();

        if (selection_range.parentElement() == textarea && this.textInputSource.type == "textarea") {
            // Check that the selection is actually in our textarea
            // Create three ranges, one containing all the text before the selection,
            // one containing all the text in the selection (this already exists), and one containing all
            // the text after the selection.

            var before_range = document.body.createTextRange();
            before_range.moveToElementText(textarea);                    // Selects all the text

            before_range.setEndPoint("EndToStart", selection_range);     // Moves the end where we need it

            var after_range = document.body.createTextRange();
            after_range.moveToElementText(textarea);                     // Selects all the text
            after_range.setEndPoint("StartToEnd", selection_range);      // Moves the start where we need it

            var before_finished = false, selection_finished = false, after_finished = false;
            var before_text, untrimmed_before_text, selection_text, untrimmed_selection_text, after_text, untrimmed_after_text;

            // Load the text values we need to compare
            before_text = untrimmed_before_text = before_range.text;
            selection_text = untrimmed_selection_text = selection_range.text;
            after_text = untrimmed_after_text = after_range.text;
            // Check each range for trimmed newlines by shrinking the range by 1 character and seeing
            // if the text property has changed.  If it has not changed then we know that IE has trimmed
            // a \r\n from the end.
            do {
                if (!before_finished) {
                    if (before_range.compareEndPoints("StartToEnd", before_range) == 0) {
                        before_finished = true;
                    } else {
                        before_range.moveEnd("character", -1)
                        if (before_range.text == before_text) {
                            untrimmed_before_text += "\r\n";
                        } else {
                            before_finished = true;
                        }
                    }
                }
                if (!selection_finished) {
                    if (selection_range.compareEndPoints("StartToEnd", selection_range) == 0) {
                        selection_finished = true;
                    } else {
                        selection_range.moveEnd("character", -1)
                        if (selection_range.text == selection_text) {
                            untrimmed_selection_text += "\r\n";
                        } else {
                            selection_finished = true;
                        }
                    }
                }
                if (!after_finished) {
                    if (after_range.compareEndPoints("StartToEnd", after_range) == 0) {
                        after_finished = true;
                    } else {
                        after_range.moveEnd("character", -1)
                        if (after_range.text == after_text) {
                            untrimmed_after_text += "\r\n";
                        } else {
                            after_finished = true;
                        }
                    }
                }

            } while ((!before_finished || !selection_finished || !after_finished));

            // Untrimmed success test to make sure our results match what is actually in the textarea
            // This can be removed once you're confident it's working correctly
            var untrimmed_text = untrimmed_before_text + untrimmed_selection_text + untrimmed_after_text;
            var untrimmed_successful = false;
            if (textarea.value == untrimmed_text) {
                untrimmed_successful = true;
            }
            // ** END Untrimmed success test

            var start = untrimmed_before_text.length;
            var end = start + selection_range.text.length;
            if (end != start)
                end += start - end;
            //alert(start+" && "+end);
            //		return startPoint;

            /*          var selectionRange = document.selection.createRange();
                        var textInputRange = this.textInputSource.createTextRange();
                        var precedingRange = this.textInputSource.createTextRange();
                        var bookmark = selectionRange.getBookmark();
                        textInputRange.moveToBookmark(bookmark);
                        precedingRange.setEndPoint("EndToStart", textInputRange);
                        start = precedingRange.text.length;
                        end = start + selectionRange.text.length;
            
                        alert("start: "+start+" and end: "+end);
            */
        }

    }
    else if (document.selection && document.selection.createRange) {
        var selectionRange = document.selection.createRange();
        var textInputRange = this.textInputSource.createTextRange();
        var precedingRange = this.textInputSource.createTextRange();
        var bookmark = selectionRange.getBookmark();
        textInputRange.moveToBookmark(bookmark);
        precedingRange.setEndPoint("EndToStart", textInputRange);
        start = precedingRange.text.length;
        end = start + selectionRange.text.length;
    }
    // all browser detection complete and variables defined there
    return {
        start: start,
        end: end
    }
}

/**************** Global variable */
// <summary>Letter Information Class</summary>
function Letter_Information() {
    this.currentLanguage = "bn_BD";
    this.replaceLastChar = false; // eita ka er por h dile  kha( khata) likha hoe jai ei typer support ditey lagbe
    this.ZWNJ = "\u200c";
    this.ZWJ = "\u200d";

    this.letterKeyMap =
	[
		["\u09be", "\u0985"], // aa-kar and onamika......... A
		["\u09ac", "\u0981"], // bandorban and chondrobindu..... B
		["\u099a", "\u099b"], // chirokaal and chobi...... C
		["\u09a1", "\u09a6"], // dahuk and dekha...... D
		["\u09c7", "\u098f"], // emni and oirabot...... E
		["\u09ab", "\u09a5"], // ful and thimpu...... F
		["\u0997", "\u0998"], // gotokal and ghatshila...... G
		["", "\u09b9"], // ____ and hotath...... H
		["\u09bf", "\u0987"], // ishrat and iishaan...... I
		["\u099c", "\u099d"], // jonogon and jhargram...... J
		["\u0995", "\u0996"], // kotha and khagrachori...... K
		["\u09b2", "\u09b6"], // lalmonirhaat and shorot...... L
		["\u09ae", "\u0983"], // minisha and dukkho...... M
		["\u09a8", "\u09a3"], // notun and notto-bidhan...... N
		["\u09cb", "\u0993"], // oli and oushodh...... O
		["\u09aa", "\u09ab"], // polashi and falgun...... P
		["\u09cd", "\u09dd"], // hasanta and ashaar...... Q
		["\u09b0", "\u09dc"], // rinita and jhor....... R
		["\u09b8", "\u09b7"], // seoul and sholoi-december...... S
		["\u099f", "\u09A4"], // tipaimukh and tutul...... T
		["\u09c1", "\u0989"], // uttom and usha...... U
		["\u09ad", "\u0982"], // vrammoman and itong-bitong...... V
		["\u09c3", "\u09a7"], // rii-kar and dhormoshala...... W
		["\u0999", "\u099e"], // 5th and 10th consonant...... X
		["\u09df", "\u09cd\u09af"], // ayan and z-fola...... Y
		["\u09af", "\u09ce"], // zoti and khanda-ta...... Z
	];
    this.numberKeyMap =
	[
		"\u09e6", "\u09e7", "\u09e8", "\u09e9", "\u09ea", "\u09eb", "\u09ec", "\u09ed", "\u09ee", "\u09ef"
	];
}


Letter_Information.prototype.switchedLetter =
[
	["\u0985", ""], ["\u09be", ""],
	["\u09c7", "\u09c8"], ["\u098f", "\u0990"],
	["\u09cb", "\u09cc"], ["\u0993", "\u0994"],
	["\u09bf", "\u09c0"], ["\u0987", "\u0988"],
	["\u09c1", "\u09c2"], ["\u0989", "\u098a"],
	["\u09c3", "\u098b"], ["\u09cd", "+"]
];
Letter_Information.prototype.getSwitchedLetter = function (inputValue) {
    var start = 0;
    for (; start < this.switchedLetter.length; ++start) {
        if (this.switchedLetter[start][0] == inputValue) {
            return this.switchedLetter[start][1];
        }
    }
    return "";
}
/* <summary>
format:  bengali letter, type, follower
Types of letters in bd =
1	= consonant
2	= vowel in kar form
3	= fola
4	= hasanta
5	= zero width non joiner
6	= mandatory end like khanda-ta
7	= vowel in Full form
</summary>
*/
Letter_Information.prototype.letter_info =
[
	["\u200d", 5, ""], ["\u0964", 1, "\u002e"], ["\u0981", 6, ""], ["\u0982", 6, ""], ["\u0983", 6, ""],/*shor-borno*/["\u0985", 7, "\u0985"], ["\u0986", 7, "\u09BE"], ["\u0987", 7, "\u09bf"], ["\u0988", 7, "\u09c0"], ["\u0989", 7, "\u09c1"], ["\u098a", 7, "\u09c2"], ["\u098b", 7, "\u09c3"], ["\u098f", 7, "\u09c7"], ["\u0990", 7, "\u09c8"], ["\u0993", 7, "\u09cb"], ["\u0994", 7, "\u09cc"], /*kobor*/["\u0995", 1, "\u0996"], ["\u0996", 1, ""], ["\u0997", 1, "\u0998"], ["\u0998", 1, ""], ["\u0999", 1, ""], /*cholonto*/["\u099a", 1, "\u099b"], ["\u099b", 1, ""], ["\u099c", 1, "\u099d"], ["\u099d", 1, ""], ["\u099e", 1, ""], /*tonkar*/["\u099f", 1, "\u09a0"], ["\u09a0", 1, ""], ["\u09a1", 1, "\u09a2"], ["\u09a2", 1, ""], ["\u09a3", 3, ""], /*tutul*/["\u09a4", 1, "\u09a5"], ["\u09a5", 1, ""], ["\u09a6", 1, "\u09a7"], ["\u09a7", 1, ""], ["\u09a8", 1, ""], /*paloan*/["\u09aa", 1, "\u09ab"], ["\u09ab", 1, ""], ["\u09ac", 3, "\u09ad"], ["\u09ad", 1, ""], ["\u09ae", 1, ""], ["\u09af", 3, ""], ["\u09b0", 3, "\u09dc"], ["\u09b2", 1, ""], /*shosank*/["\u09b6", 1, ""], ["\u09b7", 1, ""], ["\u09b8", 1, "\u09b6"], ["\u09b9", 1, ""], /*ami-amra*/["\u09be", 2, "\u0986"], ["\u09bf", 2, "\u0987"], ["\u09c0", 2, "\u0988"], ["\u09c1", 2, "\u0989"], ["\u09c2", 2, "\u098a"], ["\u09c3", 2, "\u098b"], ["\u09c7", 2, "\u098f"], ["\u09c8", 2, "\u0990"], ["\u09cb", 2, "\u0993"], ["\u09cc", 2, "\u0994"], ["\u09cd", 4, "\u09cd"], ["\u09ce", 6, ""], ["\u09d7", 2, "\u0988"], ["\u09dc", 1, "\u09dd"], ["\u09dd", 1, ""], ["\u09df", 1, ""], ["\u09f3", 6, "$"], ["\u09f7", 1, "\u002e"], ["\u09fb", 1, ""], ["\u09fc", 1, ""]
];
// <summary>binary search for a follower value</summary>
Letter_Information.prototype.getFollower = function (inputValue, propertyNo) {
    var start = 0;
    var end = this.letter_info.length - 1;
    var mid = Math.floor((end + start) / 2);

    for (; end >= start; mid = Math.floor((end + start) / 2)) {
        if (this.letter_info[mid][0] == inputValue)
            return this.letter_info[mid][propertyNo];
        if (this.letter_info[mid][0] > inputValue)
            end = mid - 1;
        else
            start = mid + 1;
    }

    return "";
}