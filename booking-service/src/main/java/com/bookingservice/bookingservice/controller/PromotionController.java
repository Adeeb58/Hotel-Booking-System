package com.bookingservice.bookingservice.controller;

import com.bookingservice.bookingservice.entity.Promotion;
import com.bookingservice.bookingservice.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping
    public Promotion createPromotion(@RequestBody Promotion promotion) {
        return promotionService.createPromotion(promotion);
    }

    @GetMapping("/validate/{code}")
    public Promotion validatePromotion(@PathVariable String code) {
        return promotionService.validateAndGetPromotion(code);
    }
}
