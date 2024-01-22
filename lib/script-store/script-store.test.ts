import { expect } from "chai";

import { AddScript, SearchScript } from "./script-store";

describe("ScriptStore", () => {
  it("Adds and fetches the scripts", () => {
    const on = AddScript;

    const onApple = () => {};
    const onBanana = () => {};
    const onPear = () => {};
    const onStar = () => {};
    const onVeggieNotPotato = () => {};
    const onPotato = () => {};

    on("*", onStar);
    on("pear", onPear);
    on("apple", onApple);
    on("banana", onBanana);
    on("veggies/*", onVeggieNotPotato);
    on("veggies/potato/*", onPotato);

    expect(SearchScript("/")).to.equal(onStar);
    expect(SearchScript("apple")).to.equal(onApple);
    expect(SearchScript("banana")).to.equal(onBanana);
    expect(SearchScript("pear")).to.equal(onPear);
    expect(SearchScript("*")).to.equal(onStar);

    expect(SearchScript("veggies")).to.equal(onVeggieNotPotato);
    expect(SearchScript("veggies/squash")).to.equal(onVeggieNotPotato);
    expect(SearchScript("veggies/squash/gourd")).to.equal(onVeggieNotPotato);

    expect(SearchScript("veggies/potato")).to.equal(onPotato);
    expect(SearchScript("veggies/potato/spud")).to.equal(onPotato);
  });
});
