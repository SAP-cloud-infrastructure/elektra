export const validatePolicy = (policy) => {
  const rx = (attr) => policy[attr] || '';
  if (rx('match_repository') === '' && rx('except_repository') === '' && rx('match_tag') === '' && rx('except_tag') === '') {
    return `need to configure at least one condition`;
  }

  if (rx('match_repository') == '') {
    return `repository name regex may not be empty`;
  }
  if (rx('match_tag') === '') {
    return `tag name regex may not be empty`;
  }
  return null;
};
