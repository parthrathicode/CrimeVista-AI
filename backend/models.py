from sqlalchemy import create_engine, Column, Integer, String, DateTime, Date, Float, ForeignKey, Boolean, Text, ForeignKeyConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class State(Base):
    __tablename__ = "states"
    StateID = Column(Integer, primary_key=True)
    StateName = Column(String(100), nullable=False)
    NationalityID = Column(Integer, nullable=True)
    Active = Column(Boolean, default=True)

    districts = relationship("District", back_populates="state")
    units = relationship("Unit", back_populates="state")

class District(Base):
    __tablename__ = "districts"
    DistrictID = Column(Integer, primary_key=True)
    DistrictName = Column(String(100), nullable=False)
    StateID = Column(Integer, ForeignKey("states.StateID"), nullable=False)
    Active = Column(Boolean, default=True)
    
    # Analytics / Spatial Fields
    centroid_lat = Column(Float, nullable=True)
    centroid_lng = Column(Float, nullable=True)
    population = Column(Integer, nullable=True)
    urbanization_pct = Column(Float, nullable=True)

    state = relationship("State", back_populates="districts")
    units = relationship("Unit", back_populates="district")
    cases = relationship("CaseMaster", back_populates="district")

class UnitType(Base):
    __tablename__ = "unit_types"
    UnitTypeID = Column(Integer, primary_key=True)
    UnitTypeName = Column(String(100), nullable=False)
    CityDistState = Column(String(100), nullable=True)

    units = relationship("Unit", back_populates="unit_type")

class Unit(Base):
    __tablename__ = "units"
    UnitID = Column(Integer, primary_key=True)
    UnitName = Column(String(200), nullable=False)
    TypeID = Column(Integer, ForeignKey("unit_types.UnitTypeID"), nullable=True)
    ParentUnit = Column(Integer, nullable=True)  # Self-reference ID
    StateID = Column(Integer, ForeignKey("states.StateID"), nullable=True)
    DistrictID = Column(Integer, ForeignKey("districts.DistrictID"), nullable=True)
    Active = Column(Boolean, default=True)
    
    # Coordinates for mapping
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    unit_type = relationship("UnitType", back_populates="units")
    state = relationship("State", back_populates="units")
    district = relationship("District", back_populates="units")
    employees = relationship("Employee", back_populates="unit")
    cases = relationship("CaseMaster", back_populates="station")

class Rank(Base):
    __tablename__ = "ranks"
    RankID = Column(Integer, primary_key=True)
    RankName = Column(String(100), nullable=False)
    Hierarchy = Column(Integer, nullable=True)
    Active = Column(Boolean, default=True)

    employees = relationship("Employee", back_populates="rank")

class Designation(Base):
    __tablename__ = "designations"
    DesignationID = Column(Integer, primary_key=True)
    DesignationName = Column(String(100), nullable=False)
    Active = Column(Boolean, default=True)
    SortOrder = Column(Integer, nullable=True)

    employees = relationship("Employee", back_populates="designation")

class Employee(Base):
    __tablename__ = "employees"
    EmployeeID = Column(Integer, primary_key=True)
    DistrictID = Column(Integer, ForeignKey("districts.DistrictID"), nullable=True)
    UnitID = Column(Integer, ForeignKey("units.UnitID"), nullable=True)
    RankID = Column(Integer, ForeignKey("ranks.RankID"), nullable=True)
    DesignationID = Column(Integer, ForeignKey("designations.DesignationID"), nullable=True)
    KGID = Column(String(50), unique=True, nullable=False)
    FirstName = Column(String(100), nullable=False)
    EmployeeDOB = Column(Date, nullable=True)
    GenderID = Column(Integer, nullable=True)
    BloodGroupID = Column(Integer, nullable=True)
    PhysicallyChallenged = Column(Boolean, default=False)
    AppointmentDate = Column(Date, nullable=True)

    unit = relationship("Unit", back_populates="employees")
    rank = relationship("Rank", back_populates="employees")
    designation = relationship("Designation", back_populates="employees")
    registered_cases = relationship("CaseMaster", back_populates="officer")

class CaseCategory(Base):
    __tablename__ = "case_categories"
    CaseCategoryID = Column(Integer, primary_key=True)
    LookupValue = Column(String(50), nullable=False)  # FIR, UDR, PAR...

    cases = relationship("CaseMaster", back_populates="category")

class GravityOffence(Base):
    __tablename__ = "gravity_offence"
    GravityOffenceID = Column(Integer, primary_key=True)
    LookupValue = Column(String(50), nullable=False)  # Heinous, Non-Heinous

    cases = relationship("CaseMaster", back_populates="gravity_level")

class CaseStatusMaster(Base):
    __tablename__ = "case_status_master"
    CaseStatusID = Column(Integer, primary_key=True)
    CaseStatusName = Column(String(100), nullable=False)  # Under Investigation, Charge Sheeted, etc.

    cases = relationship("CaseMaster", back_populates="status")

class Court(Base):
    __tablename__ = "courts"
    CourtID = Column(Integer, primary_key=True)
    CourtName = Column(String(200), nullable=False)
    DistrictID = Column(Integer, ForeignKey("districts.DistrictID"), nullable=True)
    StateID = Column(Integer, ForeignKey("states.StateID"), nullable=True)
    Active = Column(Boolean, default=True)

    cases = relationship("CaseMaster", back_populates="court")

class CrimeHead(Base):
    __tablename__ = "crime_heads"
    CrimeHeadID = Column(Integer, primary_key=True)
    CrimeGroupName = Column(String(200), nullable=False)  # Major Category
    Active = Column(Boolean, default=True)

    sub_heads = relationship("CrimeSubHead", back_populates="crime_head")
    cases = relationship("CaseMaster", back_populates="major_head")

class CrimeSubHead(Base):
    __tablename__ = "crime_sub_heads"
    CrimeSubHeadID = Column(Integer, primary_key=True)
    CrimeHeadID = Column(Integer, ForeignKey("crime_heads.CrimeHeadID"), nullable=False)
    CrimeHeadName = Column(String(200), nullable=False)  # Minor Category / Sub head Name
    SeqID = Column(Integer, nullable=True)

    crime_head = relationship("CrimeHead", back_populates="sub_heads")
    cases = relationship("CaseMaster", back_populates="minor_head")

class CaseMaster(Base):
    __tablename__ = "case_master"
    CaseMasterID = Column(Integer, primary_key=True)
    CrimeNo = Column(String(50), unique=True, nullable=False)
    CaseNo = Column(String(50), nullable=False)
    CrimeRegisteredDate = Column(Date, nullable=False)
    PolicePersonID = Column(Integer, ForeignKey("employees.EmployeeID"), nullable=True)
    PoliceStationID = Column(Integer, ForeignKey("units.UnitID"), nullable=False)
    CaseCategoryID = Column(Integer, ForeignKey("case_categories.CaseCategoryID"), nullable=False)
    GravityOffenceID = Column(Integer, ForeignKey("gravity_offence.GravityOffenceID"), nullable=False)
    CrimeMajorHeadID = Column(Integer, ForeignKey("crime_heads.CrimeHeadID"), nullable=False)
    CrimeMinorHeadID = Column(Integer, ForeignKey("crime_sub_heads.CrimeSubHeadID"), nullable=False)
    CaseStatusID = Column(Integer, ForeignKey("case_status_master.CaseStatusID"), nullable=False)
    CourtID = Column(Integer, ForeignKey("courts.CourtID"), nullable=True)
    IncidentFromDate = Column(DateTime, nullable=False)
    IncidentToDate = Column(DateTime, nullable=True)
    InfoReceivedPSDate = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    BriefFacts = Column(Text, nullable=True)

    officer = relationship("Employee", back_populates="registered_cases")
    station = relationship("Unit", back_populates="cases")
    category = relationship("CaseCategory", back_populates="cases")
    gravity_level = relationship("GravityOffence", back_populates="cases")
    major_head = relationship("CrimeHead", back_populates="cases")
    minor_head = relationship("CrimeSubHead", back_populates="cases")
    status = relationship("CaseStatusMaster", back_populates="cases")
    court = relationship("Court", back_populates="cases")
    district_id = Column(Integer, ForeignKey("districts.DistrictID"), nullable=False)
    district = relationship("District", back_populates="cases")

    complainants = relationship("ComplainantDetails", back_populates="case")
    victims = relationship("Victim", back_populates="case")
    accused_list = relationship("Accused", back_populates="case")
    act_sections = relationship("ActSectionAssociation", back_populates="case")

class CasteMaster(Base):
    __tablename__ = "caste_master"
    caste_master_id = Column(Integer, primary_key=True)
    caste_master_name = Column(String(100), nullable=False)

    complainants = relationship("ComplainantDetails", back_populates="caste")

class ReligionMaster(Base):
    __tablename__ = "religion_master"
    ReligionID = Column(Integer, primary_key=True)
    ReligionName = Column(String(100), nullable=False)

    complainants = relationship("ComplainantDetails", back_populates="religion")

class OccupationMaster(Base):
    __tablename__ = "occupation_master"
    OccupationID = Column(Integer, primary_key=True)
    OccupationName = Column(String(100), nullable=False)

    complainants = relationship("ComplainantDetails", back_populates="occupation")

class ComplainantDetails(Base):
    __tablename__ = "complainant_details"
    ComplainantID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("case_master.CaseMasterID"), nullable=False)
    ComplainantName = Column(String(150), nullable=False)
    AgeYear = Column(Integer, nullable=True)
    OccupationID = Column(Integer, ForeignKey("occupation_master.OccupationID"), nullable=True)
    ReligionID = Column(Integer, ForeignKey("religion_master.ReligionID"), nullable=True)
    CasteID = Column(Integer, ForeignKey("caste_master.caste_master_id"), nullable=True)
    GenderID = Column(Integer, nullable=True)  # 1=M, 2=F, 3=T

    case = relationship("CaseMaster", back_populates="complainants")
    occupation = relationship("OccupationMaster", back_populates="complainants")
    religion = relationship("ReligionMaster", back_populates="complainants")
    caste = relationship("CasteMaster", back_populates="complainants")

class Victim(Base):
    __tablename__ = "victims"
    VictimMasterID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("case_master.CaseMasterID"), nullable=False)
    VictimName = Column(String(150), nullable=False)
    AgeYear = Column(Integer, nullable=True)
    GenderID = Column(Integer, nullable=True)  # 1=M, 2=F, 3=T
    VictimPolice = Column(String(1), default="0")  # '1' = police, '0' = citizen

    case = relationship("CaseMaster", back_populates="victims")

class Accused(Base):
    __tablename__ = "accused"
    AccusedMasterID = Column(Integer, primary_key=True)
    CaseMasterID = Column(Integer, ForeignKey("case_master.CaseMasterID"), nullable=False)
    AccusedName = Column(String(150), nullable=False)
    AgeYear = Column(Integer, nullable=True)
    GenderID = Column(Integer, nullable=True)  # 1=M, 2=F, 3=T
    PersonID = Column(String(50), nullable=True)  # A1, A2, A3...

    case = relationship("CaseMaster", back_populates="accused_list")

class Act(Base):
    __tablename__ = "acts"
    ActCode = Column(String(50), primary_key=True)  # IPC, NDPS, etc.
    ActDescription = Column(String(250), nullable=True)
    ShortName = Column(String(100), nullable=True)
    Active = Column(Boolean, default=True)

    sections = relationship("Section", back_populates="act")

class Section(Base):
    __tablename__ = "sections"
    ActCode = Column(String(50), ForeignKey("acts.ActCode"), primary_key=True)
    SectionCode = Column(String(50), primary_key=True)
    SectionDescription = Column(String(500), nullable=True)
    Active = Column(Boolean, default=True)

    act = relationship("Act", back_populates="sections")

class ActSectionAssociation(Base):
    __tablename__ = "act_section_associations"
    CaseMasterID = Column(Integer, ForeignKey("case_master.CaseMasterID"), primary_key=True)
    ActCode = Column(String(50), primary_key=True)
    SectionCode = Column(String(50), primary_key=True)
    ActOrderID = Column(Integer, default=1)
    SectionOrderID = Column(Integer, default=1)

    case = relationship("CaseMaster", back_populates="act_sections")

    __table_args__ = (
        ForeignKeyConstraint(
            ['ActCode', 'SectionCode'],
            ['sections.ActCode', 'sections.SectionCode']
        ),
    )
