const { Container, DisplayObject, Stage } = require('../');

describe('PIXI.Stage', function ()
{
    describe('flush', function ()
    {
        it('should flush all detached subtrees, fastDetach=true', function ()
        {
            const stage = new Stage();
            const container = new Container();
            const child = new DisplayObject();

            expect(stage.innerStage.isAttached(child)).to.be.false;
            expect(stage.innerStage.isAttached(container)).to.be.false;

            container.addChild(child);

            let counter = 0;
            const trigger = () => { counter++; };

            container.on('added', trigger);
            child.on('added', trigger);
            container.on('removed', trigger);
            child.on('removed', trigger);

            stage.addChild(container);
            expect(counter).to.be.equals(2);
            expect(container.parentStage).to.be.equals(stage);
            expect(child.parentStage).to.be.equals(stage);
            expect(stage.innerStage.isAttached(container)).to.be.true;
            expect(stage.innerStage.isAttached(child)).to.be.true;

            stage.innerStage.fastDetach = true;
            stage.detachChild(container);

            expect(container.parentStage).to.be.equals(stage);
            expect(child.parentStage).to.be.equals(stage);
            expect(stage.innerStage.isDetached(container)).to.be.true;
            expect(stage.innerStage.isAttached(child)).to.be.true;
            expect(counter).to.be.equals(2);

            stage.addChild(container);

            expect(container.parentStage).to.be.equals(stage);
            expect(child.parentStage).to.be.equals(stage);
            expect(stage.innerStage.isAttached(container)).to.be.true;
            expect(stage.innerStage.isAttached(child)).to.be.true;
            expect(counter).to.be.equals(2);

            stage.detachChild(container);
            stage.innerStage.flushDetached();
            expect(container.parentStage).to.be.null;
            expect(child.parentStage).to.be.null;
            expect(stage.innerStage.countDetached()).to.be.zero;
            expect(counter).to.be.equals(4);
        });

        it('should flush all detached subtrees, fastDetach=false', function ()
        {
            const stage = new Stage();
            const container = new Container();
            const child = new DisplayObject();

            container.addChild(child);
            stage.addChild(container);

            let counter = 0;
            const trigger = () => { counter++; };

            child.on('removed', trigger);
            container.on('removed', trigger);

            stage.innerStage.fastDetach = false;
            stage.detachChild(container);
            expect(counter).to.be.equals(0);

            expect(stage.innerStage.isDetached(container)).to.be.true;
            expect(stage.innerStage.isDetached(child)).to.be.true;

            stage.innerStage.flushDetached();
            expect(counter).to.be.equals(2);
            expect(container.parentStage).to.be.null;
            expect(child.parentStage).to.be.null;
            expect(stage.innerStage.countDetached()).to.be.zero;
        });
    });

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
