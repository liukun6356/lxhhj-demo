export var hasLog = true;

//输出普通信息(含调试)
export function log(log, obj) {
  if (!hasLog) return;
  // eslint-disable-next-line no-console
  if (obj) console.log(log, obj);
  // eslint-disable-next-line no-console
  else console.log(log);
}

export var hasWarn = true;

//输出警示信息(含错误)
export function warn(log, obj) {
  if (!hasWarn) return;

  // eslint-disable-next-line no-console
  if (obj) console.warn(log, obj);
  // eslint-disable-next-line no-console
  else console.warn(log);
}
export function error(log, obj) {
  if (!hasWarn) return;

  // eslint-disable-next-line no-console
  if (obj) console.error(log, obj);
  // eslint-disable-next-line no-console
  else console.error(log);
}

export function update(val, val2 = true) {
  hasLog = val;
  hasWarn = val2;
}
