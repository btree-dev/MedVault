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
