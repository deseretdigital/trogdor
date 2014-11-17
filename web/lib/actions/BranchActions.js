/**
 * BranchActions
 */

var AppDispatcher = require('../AppDispatcher');
var BranchConstants = require('../constants/BranchConstants');

var BranchActions = {

    /**
     * @param  {string} text
     */
    create: function(name, data) {
        AppDispatcher.handleViewAction({
            actionType: BranchConstants.BRANCH_CREATE,
            name: data
        });
    },

    /**
     * @param  {string} id
     */
    destroy: function(name) {
        AppDispatcher.handleViewAction({
            actionType: BranchConstants.BRANCH_DESTROY,
            name: name
        });
    }

};

module.exports = BranchActions;