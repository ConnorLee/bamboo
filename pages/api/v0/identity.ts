import type { NextApiRequest, NextApiResponse } from "next";
import { getPDMSessionToken, _signAsPDM } from "../../../src/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { operandDID, jws } = req.body;
  if (!operandDID || !jws)
    res
      .status(400)
      .end("Must provide operandDID and jws in request to /api/v0/identity");
  try {
    const sig = await _signAsPDM(
      operandDID,
      jws,
      process.env.PDM_SEED!,
      process.env.NEXT_PUBLIC_CERAMIC_URL!
    );
    const token = await getPDMSessionToken(sig, operandDID);
    res.status(201).end(token);
  } catch (err) {
    res.status(500).end(err.message);
  }
}
