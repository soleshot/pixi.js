const { Container, DisplayObject, Stage } = require('../');

describe('PIXI.Stage', function ()
{
    describe('events', function ()
    {
        it('should trigger "added" and "removed" events on inner children', function ()
        {
            const stage = new Stage();
            const container = new Container();
            const child = new DisplayObject();

            container.addChild(child);

            let triggeredAdded = false;
            let triggeredRemoved = false;

            child.on('added', (to) =>
            {
                triggeredAdded = true;
                expect(stage.children.length).to.be.equals(1);
                expect(container.parent).to.be.equals(stage);
                expect(child.parentStage).to.be.equals(to);
            });
            child.on('removed', (from) =>
            {
                triggeredRemoved = true;
                expect(stage.children.length).to.be.equals(0);
                expect(container.parent).to.be.null;
                expect(child.parentStage).to.be.null;
                expect(stage).to.be.equals(from);
            });

            stage.addChild(container);
            expect(triggeredAdded).to.be.true;
            expect(triggeredRemoved).to.be.false;

            stage.removeChild(container);
            expect(triggeredRemoved).to.be.true;
        });
    });
});
