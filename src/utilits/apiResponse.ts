import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";


export const sendResponse = (
   c: Context,
   statusCode: ContentfulStatusCode,
   message: string,
   data: any,
) => {
   return c.json(
      {
         success: statusCode < 400,
         message,
         data,
      },
      statusCode 
      
   );
};

export const sendError = (
   c: Context,
   statusCode: ContentfulStatusCode,
   message: string,
) => {
   return c.json({
      success: false,
      status: `${statusCode}`.startsWith('4')? 'fail':'error',
      message
   },
     statusCode
   )
}

