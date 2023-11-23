let Application = require('spectron').Application
const assert = require('assert')
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
chai.should();
chai.use(chaiAsPromised);

//TODO: figure out how to launch the app without devs extension in electron and make it go through the tests.

describe('Application launch', function () {
    //this.timeout(10000);
    const appPath = path.join(__dirname, "../dist/mac/WerfenTouch.app/Contents/MacOS/WerfenTouch");
    beforeEach(function () {
        this.app = new Application({
            path: electronPath,
            args: [appPath],
            startTimeout: 20000,
            env: {
                ELECTRON_ENABLE_LOGGING: true,
                ELECTRON_ENABLE_STACK_DUMPING: true,
            },
            chromeDriverLogPath: '../chromedriverlog.txt'
        })
        chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
        return this.app.start()
    })
    afterEach(function () {
        if (this.app && this.app.isRunning()) {
            return this.app.stop()
        }
    })

    it('shows an initial window', function () {
        return this.app.client.getWindowCount().then(function (count) {
            assert.equal(count, 2)
            // Please note that getWindowCount() will return 2 if `dev tools` are opened.
            // assert.equal(count, 2)
        })
    })
    describe("test-navigation", () => {

        describe("Navigation", function () {
            it('open window', function () {
                return this.app.client.waitUntilWindowLoaded().getWindowCount().should.eventually.equal(1);
            });
            it("go to Visuals", function () {
                return this.app.client.element('.Navigation__Item:nth-of-type(2)').element('.Navigation__Icon').click();
            });
        });
    })
})

