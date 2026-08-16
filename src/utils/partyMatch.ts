/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Party matching now lives in the registry, with every other fact about a
 * party — colour, abbreviation, flag — so the six copies that used to disagree
 * cannot drift apart again. See src/data/parties.ts for what went wrong.
 *
 * Kept as a re-export so existing imports keep working.
 */
export { isPartyMatch } from '../data/parties';
