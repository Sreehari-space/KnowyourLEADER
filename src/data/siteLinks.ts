/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Outbound links for the site chrome.
 *
 * Fill in a value and the link appears; leave it empty and it is not rendered
 * at all. That is deliberate — a footer full of `href="#"` placeholders looks
 * broken to anyone who clicks one, and on a site whose whole pitch is
 * trustworthiness, a dead link is a credibility cost.
 *
 * Use complete URLs, including the scheme:
 *   x:      'https://x.com/yourhandle'
 *   github: 'https://github.com/you/knowyourleader'
 *   email:  'mailto:hello@yourdomain.com'
 */
export const SITE_LINKS = {
  /** X / Twitter profile. */
  x: '',
  /** Source repository, if the project is open. */
  github: '',
  /** Contact address, as a mailto: URL. */
  email: '',
  /** Privacy policy page. */
  privacy: '',
  /** Terms of service page. */
  terms: '',
  /** Where the data comes from. The ECI affidavit portal is the primary source. */
  dataSources: 'https://affidavit.eci.gov.in/',
} as const;

export type SiteLinkKey = keyof typeof SITE_LINKS;

/** True when a link has been configured and is safe to render. */
export const hasLink = (key: SiteLinkKey): boolean => SITE_LINKS[key].trim().length > 0;
