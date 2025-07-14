export const validatePolicy = (policy) => {
  const rx = (attr) => policy[attr] || '';
  const tc = policy.time_constraint || {};
  if (rx('match_repository') === '' && rx('except_repository') === '' && rx('match_tag') === '' && rx('except_tag') === '') {
    return `need to configure at least one condition`;
  }

  if (rx('match_repository') == '') {
    return `repository name regex may not be empty`;
  }
  if (policy.ui_hints.tag_filter === 'on' && rx('match_tag') === '') {
    return `tag name regex may not be empty`;
  }
  return null;
};
