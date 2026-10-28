// qrcode ships no types. The certificate renderer only calls `create` (it
// declares its own QrLib shape), so nothing more is typed here.
declare module "qrcode" {
  export function create(
    value: string,
    options: { errorCorrectionLevel: string },
  ): { modules: { size: number; get(row: number, column: number): boolean | number } };
}
