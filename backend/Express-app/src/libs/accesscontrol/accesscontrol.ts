import AccessControl from 'accesscontrol';

// @ts-ignore
const ac = new AccessControl();

ac.grant('user')
    .readOwn('profile')
    .updateOwn('profile');

ac.grant('admin')
    .extend('user')
    .readAny('profile')
    .updateAny('profile')
    .create('post')
    .update('post')
    .delete('post');

export default ac;