const escape = (v: string) => /^[A-Za-z0-9]+$/.test(v) ? v : JSON.stringify(v);

const sh = (strings: TemplateStringsArray, ...args: (string | number)[]) => {
  let cmd = '';

  for (let i = 0; i < args.length; i++) {
    let arg = args[i] + '';
    cmd += strings[i] + escape(arg + '');
  }

  return cmd + strings[args.length];
};
export default sh;
