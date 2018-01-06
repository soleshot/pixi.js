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
        this.allSet = {};

        /**
         * set of detached objects
         * @type {{}}
         * @private
         */
        this.detachedSet = {};

        this.tempQueueStack = [];

        this.fastDetach = true;
    }

    detachNode(node)
    {
        const dSet = this.detachedSet;

        dSet[node.uniqId] = node;
    }

    /**
     * detaches subtree
     *
     * Default implementation adds all elements in subtree to detached set
     *
     * @param subtree
     */
    detachSubtree(subtree)
    {
        const dSet = this.detachedSet;

        if (this.fastDetach)
        {
            dSet[subtree.uniqId] = subtree;

            return;
        }

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
        const aSet = this.allSet;
        const dSet = this.detachedSet;
        const q = this.tempQueueStack.pop() || [];

        q.length = 0;
        q.push(subtree);
        for (let i = 0; i < q.length; i++)
        {
            const x = q[i];

            if (x.parentStage === this)
            {
                // x was in detached state
                delete dSet[x.uniqId];
                continue;
            }
            if (x.parentStage)
            {
                x.parentStage.innerStage.removeSubtree(x);
            }
            x.parentStage = stage;
            stage.onAdd(x);
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
        const aSet = this.allSet;
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
