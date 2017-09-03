/* globals $, TD */
function SwitchAccount () {
  document.addEventListener('keyup', event => {
    if (!event.ctrlKey) return;
    if (!/Digit\d/.test(event.code)) return;
    let key = parseInt(event.keyCode, 10) - 48;
    if (Number.isNaN(key)) return;
    key = (key === 0) ? 10 : key - 1;
    const accounts = $('.js-account-list .js-account-item');
    const defaultAccount = accounts.eq(key);
    if (defaultAccount.length !== 1) return;
    const accountKey = defaultAccount.data('account-key');
    const name = defaultAccount.attr('title')
      || defaultAccount.data('original-title');
    TD.storage.accountController.setDefault(accountKey);
    const drawer = $('.js-drawer[data-drawer=compose]');
    drawer.trigger('uiAccountsSelected', {
      accountKeys: [accountKey],
    });
    const message = TD.i('Default Account Switched to {{name}}', { name });
    window.toastMessage(message);;
  });
}

module.exports = SwitchAccount;
