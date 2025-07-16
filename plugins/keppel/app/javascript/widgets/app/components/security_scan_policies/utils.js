export const validatePolicy = (policy) => {
  const rx = (attr) => policy[attr] || '';
  const actionRx = (attr) => rx('action')[attr]
  if (rx('match_repository') === '' && rx('except_repository') === '' && rx('match_vulnerability_id') === '' && rx('except_vulnerability_id') === '') {
    return `need to configure at least one condition`;
  }

  if (rx('match_repository') == '') {
    return `repository name regex may not be empty`;
  }
  if (rx('match_vulnerability_id') === '') {
    return `vulnerability ID regex may not be empty`;
  }
  if(actionRx('severity') == '' && actionRx('ignore') == false) {
    return `need to configure severity level for handling matching vulnerabilities.`
  }
  if(actionRx('assessment') == '') {
    return `need to configure an assessment.`
  }
  return null;
};
