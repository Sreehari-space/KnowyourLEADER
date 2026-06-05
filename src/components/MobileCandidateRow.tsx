/**
 * Mobile-only candidate row component.
 * Collapsed: avatar + name + party + constituency + won/lost badge
 * Expanded: + margin, assets, cases + view profile CTA
 */
import React from 'react';
import { Candidate, LanguageSetting } from '../types';

interface Props {
  candidate: Candidate;
  lang: LanguageSetting;
  expanded: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
}

export default function MobileCandidateRow({
  candidate: c,
  lang,
  expanded,
  onToggle,
  onViewProfile,
}: Props) {
  // Use existing fields if present, fallback to mapped fields
  const won = c.elected === true || c.isWinner === true;
  const photo = c.photoUrl || c.photo;
  const initial = c.name.charAt(0).toUpperCase();

  // Party-colored background for placeholder
  const placeholderStyle = {
    background: c.partyColor
      ? `color-mix(in srgb, ${c.partyColor} 18%, #F5F3EF)`
      : '#ECEAE5',
    border: `2px solid ${c.partyColor || '#D8D4CC'}`,
    color: c.partyColor || '#6B6762',
  };

  return (
    <div
      className="m-candidate-card-mobile"
      onClick={onToggle}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onToggle()}
    >
      {/* Avatar */}
      <div className="m-avatar-wrap">
        {photo ? (
          <img src={photo} alt={c.name} className="m-card-avatar" />
        ) : (
          <div className="m-card-avatar-placeholder" style={placeholderStyle}>
            {initial}
          </div>
        )}
        <span className={`m-won-dot ${won ? 'won' : 'lost'}`} />
      </div>

      {/* Info */}
      <div className="m-card-info">
        <span className="m-card-name">{c.name}</span>
        <div className="m-card-meta">
          <span className="m-card-party" style={{ color: c.partyColor }}>
            {c.party}
          </span>
          <span className="m-card-sep">·</span>
          <span className="m-card-constituency">
            {c.constituency.split('(')[0]?.trim() || c.constituency}
          </span>
        </div>
      </div>

      {/* Status badge */}
      <span className={`m-card-status ${won ? 'won' : 'lost'}`}>
        {won
          ? (lang === 'en' ? 'WON' : 'வென்றார்')
          : (lang === 'en' ? 'LOST' : 'தோற்றார்')}
      </span>

      {/* Expanded details */}
      {expanded && (
        <div className="m-card-expanded" onClick={e => e.stopPropagation()}>
          <div className="m-card-stat">
            <span className="m-cstat-label">{lang === 'en' ? 'Assets' : 'சொத்து'}</span>
            <span className="m-cstat-value">{c.netWorthFormatted}</span>
          </div>
          <div className="m-card-stat">
            <span className="m-cstat-label">{lang === 'en' ? 'Cases' : 'வழக்குகள்'}</span>
            <span className="m-cstat-value">{c.caseCount}</span>
          </div>
          <button
            className="m-card-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile();
            }}
          >
            {lang === 'en' ? 'Profile →' : 'விவரம் →'}
          </button>
        </div>
      )}
    </div>
  );
}
