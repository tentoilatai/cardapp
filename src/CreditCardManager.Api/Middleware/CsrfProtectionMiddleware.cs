namespace CreditCardManager.Api.Middleware;

public class CsrfProtectionMiddleware
{
    private readonly RequestDelegate _next;

    public CsrfProtectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string method = context.Request.Method;

        // Mutating methods (POST, PUT, DELETE, PATCH) on /api (except OpenAPI / scalar endpoints) require X-Requested-With or standard custom headers
        if (HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsDelete(method) || HttpMethods.IsPatch(method))
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                if (!context.Request.Headers.ContainsKey("X-Requested-With") &&
                    !context.Request.Headers.ContainsKey("x-requested-with"))
                {
                    // Allow if content type is application/json
                    if (!context.Request.HasJsonContentType())
                    {
                        context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        await context.Response.WriteAsync("Yêu cầu bị từ chối do thiếu header bảo vệ CSRF.");
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}
