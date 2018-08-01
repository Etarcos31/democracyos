
const debug = require('debug')
const Group = require('lib/models').Group
const log = debug('democracyos:db-api:Groups')
const utils = require('lib/utils')
const pluck = utils.pluck

/**
 * Creates Group
 *
 * @param {Object} data to create Group
 * @param {Function} fn callback function
 *   - 'err' error found on query or `null`
 *   - 'Group' Group created or `undefined`
 * @return {Module} `Group` module
 * @api public
 */

exports.create = function create (data, fn) {
  log('Creating new Group %j', data)
  var group = new Group(data)
  group.save(onsave)

  function onsave (err) {
    if (err) {
      log('Found error: %s', err)
      return fn(err)
    }

    log('Saved group with id %s', group.id)
    fn(null, group)
  }
}
/**
 * Get group form `id` string or `ObjectId`
 *
 * @param {String|ObjectId} id group's `id`
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'group' found item or `undefined`
 * @api public
 */

exports.get = function get (id, fn) {
  log('Looking for group %s', id)
  Group
    .findById(id)
    .populate('users')
    .exec(function (err, group) {
      if (err) {
        log('Found error %s', err)
        return fn(err)
      }

      if (!group) {
        log('group %s not found', id)
        return fn(null)
      }
      log('Delivering group %s', group.id)
      fn(null, group)
    })
}
/**
 * Get all Groups
 *
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 *   - 'groups' list of items found or `undefined`
 * @return {Module} `group` module
 * @api public
 */

exports.all = function all (fn) {
  log('Looking for all groups.')
  Group
    .find()
    .exec(function (err, groups) {
      if (err) {
        log('Found error %j', err)
        return fn(err)
      }
      log('Delivering all groups %j', pluck(groups, 'id'))
      fn(null, groups)
    })
  return this
}
/**
 * Remove group
 *
 * @param {String} id
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 * @api public
 */

exports.remove = function remove (id, fn) {
  exports.get(id, function (err, group) {
    if (err) return fn(err)

    group.remove(function (err) {
      if (err) {
        log('Found error %s', err)
        return fn(err)
      }

      log('group %s removed', group.id)
      fn(null)
    })
  })
}
/**
 * Update group
 *
 * @param {String} id
 * @param {Function} fn callback function
 *   - 'err' error found while process or `null`
 * @api public
 */

exports.update = function update (id, data, fn) {
  log('Updating group %s with %j', id, data)

  exports.get(id, onget)

  function onget (err, group) {
    if (err) {
      log('Found error %s', err.message)
      return fn(err)
    }

    // update and save group document with data
    group.set(data)
    group.save(onupdate)
  }

  function onupdate (err, group) {
    if (!err) {
      log('Saved group %s', group.id)
      return fn(null, group)
    }
    log('Found error %s', err)
    return fn(err)
  }

  return this
}
