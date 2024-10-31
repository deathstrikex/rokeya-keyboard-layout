import { JSDOM, VirtualConsole } from 'jsdom';
declare var global:any;

const options = {
    virtualConsole: new VirtualConsole().sendTo(console)
};
const dom = new JSDOM(
    `<html>
     <body>
        <textarea style="display:block" id="placeholderForTests" ></textarea>
        <input type="text" id="basicUsageEvents" />
     </body>
   </html>`,
   options
  );

global.window = dom.window;
global.document = dom.window.document;

import {expect} from '@jest/globals';
import { BanglaLayout } from '../src/BanglaLayout';

/***** Tests start here */
describe('Installation', () => {

    it('should initiate for textarea', () => {
        var bnLayout = new BanglaLayout("placeholderForTests");
        expect(bnLayout).not.toBeNull();
    });

    it('should initiate for input[type=text]', () => {
        var withEvents:any = {};
        withEvents.beforeKeyEvent = function () { };
        withEvents.afterKeyEvent = function () { };

        var bnLayoutWithEvents = new BanglaLayout("basicUsageEvents", withEvents);
        expect(bnLayoutWithEvents).not.toBeNull();
        
    });

    it('should throw an error for missing ID', () => {
        expect(function(){new BanglaLayout("");}).toThrowError(Error);
    });

});

describe('Keyboard Functionality', function () {
    //var pseudoKeyboard = new KeyboardHandler();
    var srcElement = <HTMLTextAreaElement> document.getElementById("placeholderForTests");

    beforeEach(() => {
        new BanglaLayout(srcElement.id);
        srcElement.value = "";
        //console.debug(`OnClickHandlers prepared for ${srcElement.id}`);
    });

    var test_key_conversion = function (givenKey: string, expectedString: string, msgOnError: string, doAssert:boolean = true) {
        const event = new window.KeyboardEvent('keydown', { key: givenKey, bubbles: true });
        srcElement.dispatchEvent(event);

        if (doAssert) {
            expect(srcElement.value).toEqual(expectedString);
            // assert.equal(srcElement.value, expectedString, msgOnError);
        }
    }

    it('Should handle numbers and single characters', () => {

        // Regular functionality
        test_key_conversion("1", '১', "Number conversion failed");
        test_key_conversion("$", '১৳', "$ is not converted to BDT symbol");
        test_key_conversion(".", '১৳।', "। is not inserted by dot symbol");

    });

    it('Should handle vowels and consonants', () => {

        // Regular functionality
        test_key_conversion("a", 'আ', "আ is not inserted initially in full-form");
        test_key_conversion("k", 'আক', "ক is not inserted");
        test_key_conversion("i", 'আকি', "ই-কার is not inserted after a consonant");
        test_key_conversion("P", 'আকিফ', "ফ is not inserted");
        test_key_conversion("Backspace", 'আকি', "Backspace is not working");
    });

    it('Should switch letter(s) by special combinations', () => {

        // Change by h
        test_key_conversion("k", 'ক', "N/A - prep step", false);
        test_key_conversion("h", 'খ', "ক is not switched to খ");
        test_key_conversion('i', "খি", "N/A - prep step", false);
        test_key_conversion('i', "খী", "Vowels in car-form is not switched by typing again");
        test_key_conversion(".", 'খী।', "N/A - prep step", false);
        test_key_conversion(".", 'খী.', "। is not switched to dot by pressing it twice");
        
    });

    it('should conjugate letters', () => {
        test_key_conversion("k", 'ক', "N/A - prep step", false);
        test_key_conversion("q", 'ক্', "N/A - prep step", false);
        test_key_conversion("r", 'ক্র', "Consonant conjugation using hasanta is not working");
        test_key_conversion("Backspace", 'ক', "Backspace is not auto-removing preceeding hasanta");

        test_key_conversion("+", 'ক্', "N/A - prep step", false);
        test_key_conversion("T", 'ক্ত', "Consonant conjugation using hasanta is not working");

    });

    it('should change language', () => {
        test_key_conversion("k", 'ক', "N/A - prep step", false);
        test_key_conversion("F9", 'ক', "Language switching key should not change text contents");
        
    });

});