/**
 * Selects PHP/JavaScript code blocks (functions) with optional support for DocBlock Comments.
 * Similar to the "Select Tag Block" HTML function.
 *
 * @category  WeBuilder Plugin
 * @package   Select Code Block
 * @author    Peter Klein <pmk@io.dk>
 * @copyright 2016
 * @license   http://www.freebsd.org/copyright/license.html  BSD License
 * @version   1.02
 */

/**
 * [CLASS/FUNCTION INDEX of SCRIPT]
 *
 *     35   function RemoveQuoted(str)
 *     46   function FindStartBracket(currentLineNum)
 *     68   function FindCodeStart(currentLineNum)
 *    108   function FindCodeEnd(currentLineNum)
 *    129   function SelectCodeBlock()
 *    157   function OnInstalled()
 *
 * TOTAL FUNCTIONS: 6
 * (This index is automatically created/updated by the WeBuilder plugin "DocBlock Comments")
 *
 */

/**
 * Helper function: Get rid of quoues and anything between them.
 *
 * @param  string  str: the string to clean
 *
 * @return string
 */
function RemoveQuoted(str) {
	return RegexReplace(str, "(\"|').*\\1", "", true);
}

/**
 * Loop forwards until we find a opening curly bracket.
 *
 * @param  int   currentLineNum the current line number
 *
 * @return int  linenumber or -1 if nothing found.
 */
function FindStartBracket(currentLineNum) {
	var match = -1;

	do {
		var currentLine = RemoveQuoted(Editor.Lines[currentLineNum]); // remove stuff in quotes
		if (RegexMatch(currentLine, "{", true) != "") {
			match = currentLineNum;
			break;
		}
		currentLineNum++;
	} while (currentLineNum != Editor.LineCount);

	return match;

}
/**
 * Loop backwards until we find a "class" or "function" keyword.
 *
 * @param  int   currentLineNum the current line number
 *
 * @return int  linenumber or -1 if nothing found.
 */
function FindCodeStart(currentLineNum) {
	var match = -1;

	do {
		// remove optional leading keywords
		var currentLine = Trim(RegexReplace(Editor.Lines[currentLineNum], "static|abstract|public|private|protected|var", "", true));
		// Support for JavaScript "function()" in various formats
		currentLine = RegexReplace(currentLine, "([^=]*=\\s*)(function)","$2", true);
		// Test if keyword is present
		if (RegexMatch(currentLine, "^(class|interface|function)", true) != "") {
			match = currentLineNum;
			break;
		}
		currentLineNum--;
	} while ( currentLineNum != 0 );

	if (match == -1) return -1;

	// Include DocBlock Comments in selection?
	if ((Script.ReadSetting("Include DocBlock Comments", "1") == "1") && (RegexMatch(Trim(Editor.Lines[currentLineNum - 1]),"^\\*/",true) != "")) {
		match = currentLineNum;
		do {
			// Test if keyword is present
			if (RegexMatch(Trim(Editor.Lines[currentLineNum]), "^\\/\\*\\*", true) != "") {
				match = currentLineNum;
				break;
			}
			currentLineNum--;
		}	while ( currentLineNum != 0 );
	}
	return match;
}

 /**
 * Loop forwards and count open and close curly brackets, returns when result is 0.
 *
 * @param  int   currentLineNum the current line number
 *
 * @return int  linenumber or -1 if nothing found.
 */
function FindCodeEnd(currentLineNum) {
	var openBrackets = 0;

	do {
		var currentLine = RemoveQuoted(Editor.Lines[currentLineNum]); // remove stuff in quotes
		openBrackets += Length(RegexReplace(currentLine, "[^{]", "", true)) - Length(RegexReplace(currentLine, "[^}]", "", true));
		if (openBrackets == 0) {
			break;
		}
		currentLineNum++;
	}	while (currentLineNum != Editor.LineCount);

	if (openBrackets == 0) return currentLineNum;
	return -1;
}

/**
 * Make selection of code block if found.
 *
 * @return void
 */
function SelectCodeBlock() {
	var uSel = Editor.Selection;
    if (Sel.SelStartLine == 0) return;

	var startLine = FindCodeStart(uSel.SelStartLine);

	if (startLine >= 0) { 						// We found the starting line
		// Find line with starting curly bracket (not always the same as the startLine)
		var bracketLine = FindStartBracket(startLine);
		if (bracketLine != -1) {				// We found the starting curly bracket
			var endLine = FindCodeEnd(bracketLine);
			if (endLine >= startLine) { 	    // We found the ending line
				// Set selection
				uSel.SelStartLine = startLine;
				uSel.SelStartCol = 0;
				uSel.SelEndLine = endLine + 1;
				uSel.SelEndCol = 0;
				Editor.Selection = uSel;
			}
		}
	}
}

/**
 * Show info when plugin is installed.
 *
 * @return void
 */
function OnInstalled() {
  Alert("Select Code Block 1.02 by Peter Klein installed sucessfully!");
}

Script.ConnectSignal("installed", "OnInstalled");
Script.RegisterDocumentAction("", "Select Code Block", "Shift+Ctrl+Q", "SelectCodeBlock");
