def main(): Unit = {
  // Bootstrap the synchronizer (wires sequencer + mediator together)
  bootstrap.synchronizer_local()

  // Connect participant to the synchronizer
  participant1.synchronizers.connect_local(sequencer1, alias = "da")

  // Wait until the participant is active on the synchronizer
  utils.retry_until_true {
    participant1.synchronizers.active("da")
  }

  // Allocate parties and create ledger API users
  val parties = Seq("Operator", "Alice", "Bob", "DrSmith", "DrJones", "PharmaCorp", "LabCorp")
  parties.foreach { name =>
    val party = participant1.parties.enable(name)
    participant1.ledger_api.users.create(
      id = name,
      actAs = Set(party),
      readAs = Set(party),
      primaryParty = Some(party)
    )
    logger.info(s"Allocated party and user: $name -> $party")
  }
}
