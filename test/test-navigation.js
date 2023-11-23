/*const testhelper = require("./spectron-helper");
const app = testhelper.initialiseSpectron();

const chaiAsPromised = require("chai-as-promised");
const chai = require("chai");
chai.should();
chai.use(chaiAsPromised);


describe("test-navigation", () => {
    before(function () {
        chaiAsPromised.transferPromiseness = app.transferPromiseness;
        return app.start();
    });
    after(function () {
        if ( app && app.isRunning() ) {
            return app.stop();
        }
    });

    describe("Navigation", function () {
        it('open window', function () {
            return app.client.waitUntilWindowLoaded().getWindowCount().should.eventually.equal(1);
        });
        it("go to Visuals", function () {
            return app.client.element('.Navigation__Item:nth-of-type(2)').element('.Navigation__Icon').click();
        });
    });
})*/
