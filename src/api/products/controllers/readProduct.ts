import { langOf } from "@/i18n";
import { Request, Response } from "express";
import { isBarcode } from "@/api/foods/helpers";
import lookupProduct from "../services/lookupProduct";

const readProduct = async (req: Request, res: Response): Promise<Response> => {
  const { barcode } = req.params;
  if (!isBarcode(barcode)) throw UserError(400, "product.badCode");

  const product = await lookupProduct(barcode, langOf(req));
  if (!product) throw UserError(404, "product.notFound");

  return res.status(200).send({ barcode, ...product });
};

export default readProduct;
