import { cd, exec, LIB } from './utils.js';

cd(LIB);
exec`npm publish --access=public --otp=${prompt('OTP:')}`;
