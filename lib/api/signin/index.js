/**
 * Module dependencies.
 */

var express = require('express')
var t = require('t-component')
var User = require('lib/models').User
var config = require('lib/config')
var jwt = require('lib/jwt')
var api = require('lib/db-api')
var normalizeEmail = require('lib/normalize-email')
var setDefaultForum = require('lib/middlewares/forum-middlewares').setDefaultForum
var initPrivileges = require('lib/middlewares/user').initPrivileges
var canCreate = require('lib/middlewares/user').canCreate
var canManage = require('lib/middlewares/user').canManage
var canView = require('lib/middlewares/user').canView

var auth = User.authenticate()

/**
 * Exports Application
 */

var app = module.exports = express()

function signin (req, res, next) {
  var email = normalizeEmail(req.body.email)
  auth(email, req.body.password, function (digestError, user, authError) {
    if (authError) {
      console.error(authError)
      return res.status(200).json({ error: t(authError.message) })
    }

    if (!user) {
      return User.findByEmail(email, function (err, user) {
        if (err) {
          console.error(err)
          return res.status(500).json({ error: t('modals.error.default', req.locale) })
        }

        if (
          user &&
          user.profiles
        ) {
          if (
            user.profiles.facebook &&
            user.profiles.facebook.email === email
          ) {
            return res.status(200).json({
              error: t('signin.error.using-facebook', req.locale)
            })
          } else if (
            user.profiles.google &&
            user.profiles.google.emails[0].value === email
          ) {
            return res.status(200).json({
              error: t('signin.error.using-google', req.locale)
            })
          }
        } else {
          return res.status(200).json({ error: t('modals.error.default', req.locale) })
        }
      })
    }

    if (!user.emailValidated) {
      return res.status(200).json({
        error: t('resend-validation-email-form.error.email-not-valid.no-link', req.locale),
        code: 'EMAIL_NOT_VALIDATED'
      })
    }

    if (user.disabledAt) {
      return res.status(200).json({ error: t('signin.account-disabled', req.locale) })
    }

    req.user = user

    return next()
  })
}

/**
 * Populate permissions after setup
 */

function addPrivileges (req, res, next) {
  return jwt.signin(api.user.expose.confidential(req.user), req, res)
}

/**
 * Define routes for SignIn module
 */

app.post('/signin', function (req, res, next) {
  var email = normalizeEmail(req.body.email)

  if (config.usersWhitelist && !~config.staff.indexOf(email)) {
    if (config.strictWhitelist) {
      api.whitelist.search({
        $or: [
          {
            $and: [
              { type: 'email' },
              { value: email }
            ]
          },
          {
            $and: [
              { type: 'domain' },
              { value: email.split('@')[1] }
            ]
          }
        ]
      }, function (err, whitelists) {
        if (err) {
          console.error(err)
        }
        if (!whitelists.length) {
          return res.status(200).json({
            error: t('signup.whitelist.email', { email: email }, req.locale),
            code: 'WHITELIST_FORBIDDEN'
          })
        } else {
          signin(req, res, next)
        }
      })
      return
    }
  }

  signin(req, res, next)
}, initPrivileges, setDefaultForum, canCreate, canManage, canView, addPrivileges)

app.delete('/signin', function (req, res, next) {
  return res.clearCookie('token').sendStatus(200)
})
