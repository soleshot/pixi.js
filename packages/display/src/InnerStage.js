/**
 * Inner stage component, handles all operations with sets of DisplayObjects
 *
 * @class
 * @memberof PIXI
 */
export default class InnerStage
{
    /**
     *
     */
    constructor(stage)
    {
        /**
         * stage this faced belongs to
         * @member {PIXI.Stage}
         */
        this.stage = stage;

        /**
         * set of attached objects
         * @type {{}}
         * @private
         */
        this.attachedSet = {};

        /**
         * set of detached objects
         * @type {{}}
         * @private
         */
        this.detachedSet = {};

        this.tempQueueStack = [];
    }

    detachSubtree(subtree)
    {
        const aSet = this.attachedSet;
        const dSet = this.detachedSet;
        const q = this.tempQueueStack.pop() || [];

        q.length = 0;
        q.push(subtree);
        for (let i = 0; i < q.length; i++)
        {
            const x = q[i];

            if (x.parentStage !== this)
            {
                continue;
            }
            dSet[x.uniqId] = x;
            delete aSet[x.uniqId];
            if (x.innerStage || !x.children)
            {
                continue;
            }
            for (let j = 0; j < x.children.length; j++)
            {
                q.push(x.children[j]);
            }
        }
        q.length = 0;
        this.tempQueueStack.push(q);
    }

    addSubtree(subtree)
    {
        const stage = this.stage;
        const aSet = this.attachedSet;
        const dSet = this.detachedSet;
        const q = this.tempQueueStack.pop() || [];

        q.length = 0;
        q.push(subtree);
        for (let i = 0; i < q.length; i++)
        {
            const x = q[i];

            if (x.parentStage !== this)
            {
                if (x.parentStage)
                {
                    x.parentStage.innerStage.removeSubtree(x);
                }
                x.parentStage = stage;
                stage.onAdd(x);
            }
            else
            {
                delete dSet[x.uniqId];
            }
            aSet[x.uniqId] = x;

            if (x.innerStage || !x.children)
            {
                continue;
            }
            for (let j = 0; j < x.children.length; j++)
            {
                q.push(x.children[j]);
            }
        }
        q.length = 0;
        this.tempQueueStack.push(q);
    }

    removeSubtree(subtree)
    {
        const stage = this.stage;
        const aSet = this.attachedSet;
        const dSet = this.detachedSet;
        const q = this.tempQueueStack.pop() || [];

        q.length = 0;
        q.push(subtree);
        for (let i = 0; i < q.length; i++)
        {
            const x = q[i];

            if (x.parentStage !== stage)
            {
                continue;
            }
            x.parentStage = null;
            stage.onRemove(x);

            delete aSet[x.uniqId];
            delete dSet[x.uniqId];

            if (x.children)
            {
                for (let j = 0; j < x.children.length; j++)
                {
                    q.push(x.children[j]);
                }
            }
        }
        q.length = 0;
        this.tempQueueStack.push(q);
    }

    flushDetached()
    {
        const stage = this.stage;
        const q = this.detachedSet;
        let key;
        let flag = false;

        for (key in q)
        {
            flag = true;
            break;
        }
        if (!flag) return;

        this.detachedSet = {};

        for (key in q)
        {
            const x = q[key];

            if (x.parentStage === stage)
            {
                x.parentStage = null;
                stage.onRemove(x);
            }
        }
    }
}
