var AppDispatcher = require('../AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var merge = require('react/lib/merge');
var BranchConstants = require('../constants/BranchConstants');
var $ = require('jquery2');
var _ = require('lodash');

var CHANGE_EVENT = 'change';

var _branches = {}; // collection of todo items

/**
 * Create a TODO item.
 * @param {string} text The content of the TODO
 */
function create(name, branchData) {
    // Using the current timestamp in place of a real id.
    _branches[name] = {
        id: id,
        data: data
    };
}

/**
 * Delete a TODO item.
 * @param {string} id
 */
function destroy(name) {
    delete _branches[name];
}

var BranchStore = merge(EventEmitter.prototype, {

    /**
     * Get the entire collection of TODOs.
     * @return {object}
     */
    getAll: function() {
        return _branches;
    },

    emitChange: function() {
        this.emit(CHANGE_EVENT);
    },

    /**
     * @param {function} callback
     */
    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    /**
     * @param {function} callback
     */
    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    /**
     *
     */
    loadAllBranches: function(){
        $.ajax('/api/branches', {
            type: 'GET',
            dataType: 'json',
            success: function(data, status){
                console.log('loadAllBranches data', data);
                _.forEach(data.branches, function(branch))
            }
        });
    },

    dispatcherIndex: AppDispatcher.register(function(payload) {
        var action = payload.action;
        var data, name;

        switch(action.actionType) {
            case BranchConstants.BRANCH_CREATE:
                data = action.data;
                name = action.name;
                if (name !== '') {
                    create(name, data);
                    BranchStore.emitChange();
                }
                break;

            case 'BRANCH_DESTORY':
                destroy(action.name);
                BranchStore.emitChange();
                break;

            // add more cases for other actionTypes, like TODO_UPDATE, etc.
        }

        return true; // No errors. Needed by promise in Dispatcher.
    })

});

module.exports = BranchStore;