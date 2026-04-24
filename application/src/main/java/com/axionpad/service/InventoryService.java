package com.axionpad.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiConsumer;

/**
 * Thread-safe inventory service.
 * Reserves stock atomically; fires an alert callback when stock falls below
 * a configurable threshold or when a reservation is refused.
 */
public class InventoryService {

    private final Map<String, Integer> stock = new ConcurrentHashMap<>();

    /**
     * Optional alert handler: (productId, message) → void.
     * Called on the same thread that triggered the stock event.
     */
    private BiConsumer<String, String> alertHandler = (id, msg) ->
            DebugLogger.log("[Inventory] ALERT " + id + " — " + msg);

    public void setAlertHandler(BiConsumer<String, String> handler) {
        this.alertHandler = handler;
    }

    /** Initialise or overwrite the stock level for a product. */
    public void setStock(String productId, int quantity) {
        if (quantity < 0) throw new IllegalArgumentException("Stock cannot be negative");
        stock.put(productId, quantity);
        DebugLogger.log("[Inventory] Stock set: " + productId + " = " + quantity);
    }

    /** Returns current stock, or 0 if the product is unknown. */
    public int getStock(String productId) {
        return stock.getOrDefault(productId, 0);
    }

    /**
     * Attempts to reserve {@code requestedQty} units of {@code productId}.
     *
     * <p>The operation is atomic: either the full quantity is reserved or
     * nothing changes and {@link InsufficientStockException} is thrown.
     *
     * @throws InsufficientStockException if available stock < requestedQty
     */
    public void reserve(String productId, int requestedQty) {
        if (requestedQty <= 0) throw new IllegalArgumentException("Requested quantity must be > 0");

        stock.compute(productId, (id, current) -> {
            int available = (current == null) ? 0 : current;
            if (available < requestedQty) {
                alertHandler.accept(id, String.format(
                        "Rupture — demandé: %d, disponible: %d", requestedQty, available));
                throw new InsufficientStockException(id, available, requestedQty);
            }
            int remaining = available - requestedQty;
            if (remaining == 0) {
                alertHandler.accept(id, "Dernier stock épuisé après réservation de " + requestedQty);
            }
            return remaining;
        });

        DebugLogger.log(String.format("[Inventory] Reserved %d × %s — remaining: %d",
                requestedQty, productId, getStock(productId)));
    }

    /** Releases (restocks) units, e.g. after a cancelled order. */
    public void release(String productId, int qty) {
        if (qty <= 0) throw new IllegalArgumentException("Released quantity must be > 0");
        stock.merge(productId, qty, Integer::sum);
        DebugLogger.log(String.format("[Inventory] Released %d × %s — new total: %d",
                qty, productId, getStock(productId)));
    }

    // ── Exception ─────────────────────────────────────────────────────────────

    public static class InsufficientStockException extends RuntimeException {

        public final String productId;
        public final int available;
        public final int requested;

        public InsufficientStockException(String productId, int available, int requested) {
            super(String.format(
                    "Stock insuffisant pour '%s' : %d demandé, %d disponible",
                    productId, requested, available));
            this.productId = productId;
            this.available = available;
            this.requested = requested;
        }
    }
}
