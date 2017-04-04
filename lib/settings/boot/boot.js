import 'native-promise-only'
import page from 'page'
import timeago from 'democracyos-timeago'
import config from '../../config/config'

import 'lib/boot/moment'

import '../../translations/translations'

/**
 * Enable client-side debug messages
 */

import '../../debug'

/*
* Register routes aliases
*/

import 'lib/boot/routes'

/**
 * Mount applications.
 */
import '../../analytics'
import '../../header/header'
import '../../error-pages/error-pages'
import '../../settings/settings/settings'
import '../../settings/forum-new/forum-new'
import '../../404/404'

/**
 * Init `timeago` component with parameter locale
 */

timeago('.ago', { lang: config.locale, interval: 1000 })

/**
 * Init page.js
 */

page()

if (config.googleAnalyticsTrackingId) {
  require('democracyos-ga')(config.googleAnalyticsTrackingId)
}
