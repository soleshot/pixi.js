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
         * set of all objects
         * @member {{}}
         * @readonly
         */
        this.allSet = {};

        /**
         * set of detached objects
         * @member {{}}
         * @readonly
         */
        this.detachedSet = {};

        /**
         * Temporary stack for BFS
         *
         * @type {Array}
         * @private
         */
        this.tempQueueStack = [];

        /**
         * When elements are detached - someone has to do the real work.
         *
         * With this flag set, `detach` will be faster, but `flush` will go slower
         *
         * If the flag is set, only roots of detached subtrees appear in `detachedSet`
         *
         * Please set it before you do any detach operations
         *
         * @member {boolean}
         */
        this.fastDetach = true;
    }

    /**
     * detaches subtree
     *
     * If `fastDetach` flag is set to false, it will add elements to detached state recursively
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

    /**
     * Adds subtree, recursively fires events and sets stage
     *
     * @param subtree
     */
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

    /**
     * Removes subtree, recursively fires events and sets stage to null
     *
     * @param subtree
     */
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

    /**
     * Fires events on all detached subtrees
     *
     * If `fastDetach` flag is set, flush goes slower, because it goes recursively
     */
    flushDetached()
    {
        const stage = this.stage;
        const q = this.detachedSet;

        for (const key in q)
        {
            const x = q[key];

            if (x.parentStage === stage)
            {
                x.parentStage = null;
                if (this.fastDetach)
                {
                    this.removeSubtree(x);
                }
                else
                {
                    stage.onRemove(x);
                    delete this.detachedSet[x];
                }
            }
        }
    }
}
