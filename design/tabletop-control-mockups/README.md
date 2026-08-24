# Tabletop control-surface mock-ups

This directory records the design study behind the production tabletop controls. All sixteen room overlays now use live game state and dispatch the same typed actions as the personal-screen controls.

The player positions use a 3×3 ring with no center position:

```text
1 2 3   rotate 180° toward the top edge
4 · 6   rotate +90° toward the left / −90° toward the right
7 8 9   stay upright toward the bottom edge
```

The active room expands over its board position and uses the room artwork as the control backdrop. The persistent side inspector is absent. Text is retained only for the room name, concise rules reminder, and confirmation; choices themselves are represented by goods, cards, pieces, tracks, dice, tiles, room art, and currency.

Run `bun run dev` and open `/mockups/tabletop/?place=1` to review the production room surfaces against fixture data. Change `place` from 1 through 16 and use `seat` from 1 through 8 to review every room and player-facing orientation without entering real gameplay.

For example, open `/mockups/tabletop/?place=2&seat=1` for a top seat, `seat=4` for the right edge, or `seat=6` for the bottom edge. In a live tabletop game the active Place is highlighted; tapping it expands this surface over the board and faces it toward the active player.

![Production Fabric Warehouse, top seat](production-fabric-warehouse-top-seat.png)

![Production Fabric Warehouse, right seat](production-fabric-warehouse-right-seat.png)

![Production Fabric Warehouse, bottom seat](production-fabric-warehouse-bottom-seat.png)

## Room views

1. Wainwright — direct 7-Lira-to-extension exchange

   ![Wainwright control mock-up](01-wainwright.png)

2. Fabric Warehouse — supply pile filling a capacity track

   ![Fabric Warehouse control mock-up](02-fabric-warehouse.png)

3. Spice Warehouse — supply pile filling a capacity track

   ![Spice Warehouse control mock-up](03-spice-warehouse.png)

4. Fruit Warehouse — supply pile filling a capacity track

   ![Fruit Warehouse control mock-up](04-fruit-warehouse.png)

5. Post Office — four exposed mail-track rewards

   ![Post Office control mock-up](05-post-office.png)

6. Caravansary — graphical deck/discard sources and keep/discard draft

   ![Caravansary control mock-up](06-caravansary.png)

7. Fountain — assistants selected on the board and recalled to the merchant

   ![Fountain control mock-up](07-fountain.png)

8. Black Market — basic-good picker plus visible dice thresholds

   ![Black Market control mock-up](08-black-market.png)

9. Tea House — circular wager dial, dice, and graphical outcomes

   ![Tea House control mock-up](09-tea-house.png)

10. Large Market — demand tile, selectable demand slots, and live payout

    ![Large Market control mock-up](10-large-market.png)

11. Small Market — demand tile, selectable demand slots, and live payout

    ![Small Market control mock-up](11-small-market.png)

12. Police Station — destination grid made from the actual room artwork

    ![Police Station control mock-up](12-police-station.png)

13. Sultan's Palace — escalating goods offer matched against inventory

    ![Sultan's Palace control mock-up](13-sultans-palace.png)

14. Small Mosque — graphical tile abilities and their goods costs

    ![Small Mosque control mock-up](14-small-mosque.png)

15. Great Mosque — graphical tile abilities and their goods costs

    ![Great Mosque control mock-up](15-great-mosque.png)

16. Gemstone Dealer — current/next prices and direct Lira-to-ruby exchange

    ![Gemstone Dealer control mock-up](16-gemstone-dealer.png)
