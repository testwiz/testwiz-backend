export const formatString = (
  str: string,
  values: Array<{ key: string; value: string }>
) => {
  let tmpStr = str;
  values.forEach((e) => {
    while (tmpStr.indexOf(`%${e.key}%`) !== -1) {
      tmpStr = tmpStr.replace(`%${e.key}%`, e.value);
    }
  });
  return tmpStr;
};
